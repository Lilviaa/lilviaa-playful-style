import smtplib
from email.message import EmailMessage
from email.utils import make_msgid, formatdate
from app.core.config import settings

def _send_email(to_email: str, subject: str, html_content: str):
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        print(f"WARNING: SMTP not configured. Skipped sending email to {to_email}. Subject: {subject}")
        return

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = settings.SMTP_FROM_EMAIL
    msg['To'] = to_email
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid()
    
    msg.set_content("Please enable HTML to view this email.")
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.ENVIRONMENT != "production":
                server.set_debuglevel(1)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Successfully sent email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")



def send_order_confirmation_email(to_email: str, order_data: dict, items: list):
    order_id = order_data.get("id")
    total_amount = order_data.get("total_amount")
    
    items_html = ""
    for item in items:
        # We assume `item` is a dict with details. We might need to handle fetching product details beforehand.
        items_html += f"<li>Variant {item.get('product_variant_id')}: {item.get('quantity')} x {item.get('unit_price')} INR</li>"
        
    subject = f"Order Confirmation - {order_id}"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d25f5f;">Lilviaa - Order Confirmed!</h2>
        <p>Hello,</p>
        <p>Thank you for shopping with Lilviaa! Your order has been successfully placed.</p>
        
        <h3>Order Details (#{order_id})</h3>
        <ul>
            {items_html}
        </ul>
        <p><strong>Total Amount: </strong> ₹{total_amount}</p>
        
        <p>We will notify you once your order is shipped.</p>
        <p>Best regards,<br>The Lilviaa Team</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html)
