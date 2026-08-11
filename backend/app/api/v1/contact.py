from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
import os
import json
import httpx
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime, timezone
import logging

from app.core.limiter import limiter, PreAuthRateLimit

logger = logging.getLogger(__name__)
router = APIRouter()


class ContactFormRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    subject: str
    message: str
    turnstile_token: str


async def verify_turnstile(token: str, ip: str) -> bool:
    """Verifies the Cloudflare Turnstile token."""
    secret_key = os.environ.get("TURNSTILE_SECRET_KEY")
    
    # If no secret key is configured, assume bypass (for local dev/testing before setup)
    if not secret_key or secret_key.startswith("your_"):
        logger.warning("Turnstile Secret Key not configured. Bypassing captcha verification.")
        return True

    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    payload = {
        "secret": secret_key,
        "response": token,
        "remoteip": ip
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=payload)
            data = response.json()
            if data.get("success"):
                return True
            else:
                logger.error(f"Turnstile verification failed: {data.get('error-codes')}")
                return False
    except Exception as e:
        logger.error(f"Error calling Turnstile API: {e}")
        return False


def get_google_sheets_client():
    """Initializes and returns the gspread client."""
    private_key = os.environ.get("GOOGLE_PRIVATE_KEY", "")
    if private_key:
        # The key comes with literal \n strings if loaded from .env, need to replace them
        private_key = private_key.replace("\\n", "\n")
        # Remove surrounding quotes if they exist
        if private_key.startswith('"') and private_key.endswith('"'):
            private_key = private_key[1:-1]

    credentials_dict = {
        "type": "service_account",
        "project_id": os.environ.get("GOOGLE_PROJECT_ID", ""),
        "private_key_id": "",
        "private_key": private_key,
        "client_email": os.environ.get("GOOGLE_CLIENT_EMAIL", ""),
        "client_id": "",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.environ.get('GOOGLE_CLIENT_EMAIL', '')}",
        "universe_domain": "googleapis.com"
    }

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]

    try:
        creds = Credentials.from_service_account_info(credentials_dict, scopes=scopes)
        client = gspread.authorize(creds)
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Google Sheets client: {e}")
        return None


@router.post("", dependencies=[Depends(PreAuthRateLimit("5/minute"))])
@limiter.limit("3/minute")
async def submit_contact_form(request: Request, form_data: ContactFormRequest):
    """
    Receives contact form submission, validates Turnstile captcha, 
    and appends data to Google Sheets.
    """
    
    # 1. Verify Turnstile Captcha
    client_ip = request.client.host if request.client else ""
    is_valid_captcha = await verify_turnstile(form_data.turnstile_token, client_ip)
    
    if not is_valid_captcha:
        raise HTTPException(status_code=400, detail="Captcha verification failed. Please try again.")

    # 2. Append to Google Sheets
    client = get_google_sheets_client()
    if not client:
        # If sheets aren't configured properly, log it but don't crash completely.
        # However, for the contact form, we want to know it failed.
        raise HTTPException(status_code=500, detail="Server configuration error for Google Sheets.")

    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    sheet_name = os.environ.get("GOOGLE_SHEET_NAME", "Contact Form")

    if not sheet_id:
        raise HTTPException(status_code=500, detail="Google Sheet ID not configured.")

    try:
        # Open the specific spreadsheet and worksheet
        spreadsheet = client.open_by_key(sheet_id)
        
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            logger.warning(f"Worksheet '{sheet_name}' not found. Falling back to the first sheet (Sheet1).")
            worksheet = spreadsheet.sheet1
        
        # Prepare the row data based on the columns:
        # Timestamp | First Name | Last Name | Email | Phone | Subject | Message
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        
        row_data = [
            timestamp,
            form_data.first_name,
            form_data.last_name,
            form_data.email,
            form_data.phone,
            form_data.subject,
            form_data.message
        ]
        
        # Append the row
        worksheet.append_row(row_data)
        
    except Exception as e:
        logger.error(f"Failed to append to Google Sheet: {e}")
        raise HTTPException(status_code=500, detail="Failed to save your message. Please try again later.")

    return {"status": "success", "message": "Message sent successfully!"}
