import os
import re
import logging
import httpx

logger = logging.getLogger(__name__)


def _get_config():
    """Reads WhatsApp Cloud API config from environment variables."""
    return {
        "access_token": os.environ.get("WHATSAPP_ACCESS_TOKEN", ""),
        "phone_number_id": os.environ.get("WHATSAPP_PHONE_NUMBER_ID", ""),
        "api_version": os.environ.get("WHATSAPP_API_VERSION", "v21.0"),
        "owner_number": os.environ.get("OWNER_WHATSAPP_NUMBER", ""),
    }


def _normalize_phone(raw: str) -> str | None:
    """
    Validate and normalize a phone number to the format required by
    the WhatsApp Cloud API: country-code + number, no '+' prefix,
    no leading zero after country code.  e.g. '91XXXXXXXXXX'.

    Returns None (and logs a warning) if the number is malformed.
    """
    if not raw:
        return None

    # Strip whitespace, dashes, parentheses, and leading '+'
    cleaned = re.sub(r"[\s\-\(\)\+]", "", str(raw))

    # Must be all digits after cleaning
    if not cleaned.isdigit():
        logger.warning(f"WhatsApp phone number contains non-digit characters after cleaning: {raw}")
        return None

    # Indian numbers: if it starts with '0', strip the leading zero
    if cleaned.startswith("0"):
        cleaned = cleaned[1:]

    # If it looks like a bare 10-digit Indian number, prepend '91'
    if len(cleaned) == 10:
        cleaned = "91" + cleaned

    # Sanity: must be between 10 and 15 digits (E.164 range)
    if not (10 <= len(cleaned) <= 15):
        logger.warning(f"WhatsApp phone number has unexpected length ({len(cleaned)}): {raw}")
        return None

    return cleaned


def send_template_message(
    to: str,
    template_name: str,
    language_code: str = "en",
    components: list | None = None,
) -> dict | None:
    """
    Send a WhatsApp template message via Meta's Cloud API.

    POST https://graph.facebook.com/{version}/{phone_id}/messages

    Returns the API response dict on success, or None on failure.
    Never raises — failures are logged only.
    """
    config = _get_config()

    if not config["access_token"] or config["access_token"].startswith("YOUR_"):
        logger.warning("WHATSAPP_ACCESS_TOKEN is not configured. Skipping WhatsApp message.")
        return None

    if not config["phone_number_id"] or config["phone_number_id"].startswith("YOUR_"):
        logger.warning("WHATSAPP_PHONE_NUMBER_ID is not configured. Skipping WhatsApp message.")
        return None

    phone = _normalize_phone(to)
    if not phone:
        logger.warning(f"Skipping WhatsApp message — invalid phone: {to}")
        return None

    url = (
        f"https://graph.facebook.com/{config['api_version']}"
        f"/{config['phone_number_id']}/messages"
    )

    headers = {
        "Authorization": f"Bearer {config['access_token']}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code},
        },
    }

    if components:
        payload["template"]["components"] = components

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload, headers=headers)

        if resp.status_code in (200, 201):
            logger.info(f"WhatsApp template '{template_name}' sent to {phone}")
            return resp.json()
        else:
            logger.error(
                f"WhatsApp API error ({resp.status_code}) sending '{template_name}' to {phone}: "
                f"{resp.text}"
            )
            return None
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {phone}: {str(e)}")
        return None


def _format_inr(amount) -> str:
    """Format a number as ₹X,XXX.XX"""
    try:
        return f"₹{float(amount):,.2f}"
    except (ValueError, TypeError):
        return f"₹{amount}"


def _build_item_summary(order_data: dict) -> str:
    """Build a short text summary of order items, e.g. 'Mock T-Shirt x2, Mock Jacket x1'."""
    items = order_data.get("items") or order_data.get("order_items") or []
    parts = []
    for item in items:
        product = item.get("product_variants", {}).get("products", {}) or item
        name = product.get("name", item.get("name", "Item"))
        qty = item.get("quantity", item.get("qty", 1))
        parts.append(f"{name} x{qty}")
    return ", ".join(parts) if parts else "Order items"


def _get_order_short_id(order_data: dict) -> str:
    """Generate a human-friendly short order ID, same logic as mailer.py."""
    order_id = str(order_data.get("id", ""))
    hex_prefix = order_id.replace("-", "")[:6]
    try:
        numeric_hash = str(int(hex_prefix, 16)).zfill(6)
        return f"ORD-LV-{numeric_hash}"
    except ValueError:
        return f"ORD-LV-{order_id[:6].upper()}"


def send_customer_order_confirmation(order_data: dict):
    """
    Send the 'order_confirmation_customer' WhatsApp template to the customer.

    Template variables (body):
      {{1}} = Customer name
      {{2}} = Order ID
      {{3}} = Total amount
      {{4}} = Item summary
    """
    try:
        # Extract customer phone from the order's address snapshot
        address = order_data.get("addresses") or order_data.get("shipping_address") or {}
        if isinstance(address, list):
            address = address[0] if address else {}

        customer_phone = address.get("phone") or order_data.get("phone")
        if not customer_phone:
            logger.warning(
                f"No customer phone for order {order_data.get('id')}. "
                "Skipping WhatsApp customer confirmation."
            )
            return

        customer_name = address.get("full_name", order_data.get("full_name", "Customer"))
        short_id = _get_order_short_id(order_data)
        total = _format_inr(order_data.get("total_amount", order_data.get("grand_total", 0)))
        item_summary = _build_item_summary(order_data)

        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": str(customer_name)},
                    {"type": "text", "text": short_id},
                    {"type": "text", "text": total},
                    {"type": "text", "text": item_summary},
                ],
            }
        ]

        send_template_message(
            to=customer_phone,
            template_name="order_confirmation_customer",
            language_code="en",
            components=components,
        )
    except Exception as e:
        logger.error(
            f"Error in WhatsApp send_customer_order_confirmation "
            f"for order {order_data.get('id')}: {str(e)}"
        )


def send_owner_order_alert(order_data: dict):
    """
    Send the 'order_alert_owner' WhatsApp template to the store owner.

    Template variables (body) — must match approved template exactly:
      {{1}} = Order ID       (e.g. ORD-LV-810ACE)
      {{2}} = Invoice ID     (e.g. INV-LV-810ACE, derived from order UUID)
      {{3}} = Customer name
      {{4}} = Order Value    (e.g. ₹2,247)
      {{5}} = Payment Method (e.g. RAZORPAY)

    Invoice IDs are not stored in the DB; they are computed deterministically
    from the order UUID using the same formula as the frontend invoice page.
    """
    try:
        config = _get_config()
        owner_number = config.get("owner_number")
        if not owner_number:
            logger.warning("OWNER_WHATSAPP_NUMBER not configured. Skipping owner alert.")
            return

        address = order_data.get("addresses") or order_data.get("shipping_address") or {}
        if isinstance(address, list):
            address = address[0] if address else {}

        customer_name = address.get("full_name", order_data.get("full_name", "Unknown"))
        short_id = _get_order_short_id(order_data)
        total = _format_inr(order_data.get("total_amount", order_data.get("grand_total", 0)))
        payment_method = str(order_data.get("payment_method", "unknown")).upper()

        # Derive invoice ID from order UUID using the same deterministic formula
        # as the frontend (/invoice/$orderId page): INV-LV-{first 6 hex chars as decimal}
        raw_order_id = str(order_data.get("id", ""))
        numeric_hash = str(int(raw_order_id.replace("-", "")[:6], 16)).zfill(6) if raw_order_id else "000000"
        invoice_id = f"INV-LV-{numeric_hash}"

        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": short_id},          # {{1}} Order ID
                    {"type": "text", "text": invoice_id},         # {{2}} Invoice ID
                    {"type": "text", "text": str(customer_name)}, # {{3}} Customer name
                    {"type": "text", "text": total},              # {{4}} Order Value
                    {"type": "text", "text": payment_method},     # {{5}} Payment Method
                ],
            }
        ]

        send_template_message(
            to=owner_number,
            template_name="order_alert_owner",
            language_code="en",
            components=components,
        )
    except Exception as e:
        logger.error(
            f"Error in WhatsApp send_owner_order_alert "
            f"for order {order_data.get('id')}: {str(e)}"
        )
