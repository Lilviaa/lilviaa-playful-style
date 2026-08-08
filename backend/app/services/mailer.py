import smtplib
import os
import logging
from email.message import EmailMessage
from email.utils import formatdate
from datetime import datetime

logger = logging.getLogger(__name__)

# Fallback fonts: we use 'Fraunces' if available, otherwise a serif fallback for headers
HEADER_FONT = "'Fraunces', Georgia, 'Times New Roman', serif"
BODY_FONT = "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

BRAND_COCOA = "#5C3A21"
BRAND_CREAM = "#FFFDF8"
BRAND_SAND = "#FCF8F2"
BRAND_BLUSH = "#FF8FA3"

def get_smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.environ.get("SMTP_PORT", 465)),
        "user": os.environ.get("SMTP_USER"),
        "pass": os.environ.get("SMTP_PASS"),
        "owner_email": os.environ.get("OWNER_EMAIL", "Lilviaa.byutsav@gmail.com")
    }

def send_mail(to: str, subject: str, html_body: str, plain_body: str = None):
    config = get_smtp_config()
    
    if not config["user"] or not config["pass"]:
        logger.warning("SMTP credentials not configured. Skipping email.")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"Lil Viaa <{config['user']}>"
    msg["To"] = to
    msg["Date"] = formatdate(localtime=True)

    if plain_body:
        msg.set_content(plain_body)
        if html_body:
            msg.add_alternative(html_body, subtype='html')
    else:
        msg.set_content(html_body, subtype='html')

    try:
        with smtplib.SMTP_SSL(config["host"], config["port"]) as server:
            server.login(config["user"], config["pass"])
            server.send_message(msg)
        logger.info(f"Email sent successfully to {to}")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {str(e)}")

def format_inr(amount: float) -> str:
    return f"₹{amount:,.2f}"

def send_customer_order_confirmation(order: dict):
    try:
        to_email = order.get("user_email")
        # In case the user email isn't directly on the order dict, fallback to addresses if available
        if not to_email and "addresses" in order and order["addresses"]:
            to_email = order.get("addresses", {}).get("email") # Assuming it might exist
            
        if not to_email:
            logger.warning(f"No customer email found for order {order.get('id')}. Skipping customer confirmation.")
            return

        order_id = str(order.get("id"))
        short_order_id = order_id.split("-")[0].upper()
        created_at = order.get("created_at")
        date_str = datetime.fromisoformat(created_at.replace("Z", "+00:00")).strftime("%d %b %Y") if created_at else datetime.now().strftime("%d %b %Y")
        
        items = order.get("items", []) or order.get("order_items", [])
        
        address_info = order.get("addresses", {})
        if not address_info:
            address_info = {
                "full_name": order.get("full_name", ""),
                "address": order.get("address", ""),
                "city": order.get("city", ""),
                "state": order.get("state", ""),
                "zip": order.get("zip", ""),
                "phone": order.get("phone", "")
            }

        address_html = f"""
        <p style="margin: 0; padding: 0; line-height: 1.5; color: {BRAND_COCOA}; font-size: 14px;">
            <strong>{address_info.get("full_name", "")}</strong><br>
            {address_info.get("address", "")}<br>
            {address_info.get("city", "")}, {address_info.get("state", "")} {address_info.get("zip", "")}<br>
            Phone: {address_info.get("phone", "")}
        </p>
        """

        items_html = ""
        for item in items:
            product = item.get("product_variants", {}).get("products", {}) or item
            variant = item.get("product_variants", {})
            name = product.get("name", item.get("name", "Product"))
            size = variant.get("size", item.get("size", ""))
            
            qty = item.get("quantity", item.get("qty", 1))
            price = item.get("unit_price", item.get("price", 0))
            total = qty * price
            
            size_html = f"<span style='color: #8C6D56; font-size: 12px;'>Size: {size}</span>" if size else ""
            
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px dashed {BRAND_COCOA}33; vertical-align: top;">
                    <div style="font-weight: bold; color: {BRAND_COCOA};">{name}</div>
                    {size_html}
                </td>
                <td style="padding: 12px; border-bottom: 1px dashed {BRAND_COCOA}33; text-align: center; color: {BRAND_COCOA};">{qty}</td>
                <td style="padding: 12px; border-bottom: 1px dashed {BRAND_COCOA}33; text-align: right; font-weight: bold; color: {BRAND_COCOA};">{format_inr(total)}</td>
            </tr>
            """

        subtotal = float(order.get("subtotal", 0))
        shipping = float(order.get("shipping_amount", 0))
        discount = float(order.get("discount_amount", 0))
        grand_total = float(order.get("total_amount", order.get("grand_total", 0)))

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: {BODY_FONT};">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: {BRAND_CREAM}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 0 auto;">
                            <!-- HEADER -->
                            <tr>
                                <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid {BRAND_SAND};">
                                    <h1 style="margin: 0; font-family: {HEADER_FONT}; color: {BRAND_BLUSH}; font-size: 32px; letter-spacing: -0.5px;">Lil Viaa</h1>
                                    <h2 style="margin: 15px 0 0 0; font-family: {HEADER_FONT}; color: {BRAND_COCOA}; font-size: 24px;">Order Confirmed!</h2>
                                    <p style="margin: 10px 0 0 0; color: #8C6D56; font-size: 14px;">Thank you for your purchase. Your order has been received.</p>
                                </td>
                            </tr>

                            <!-- ORDER META -->
                            <tr>
                                <td style="padding: 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td width="50%" style="color: #8C6D56; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order ID</td>
                                            <td width="50%" style="text-align: right; color: #8C6D56; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Date</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold; color: {BRAND_COCOA}; font-size: 16px; padding-top: 5px;">#{short_order_id}</td>
                                            <td style="text-align: right; font-weight: bold; color: {BRAND_COCOA}; font-size: 14px; padding-top: 5px;">{date_str}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- ITEMS TABLE -->
                            <tr>
                                <td style="padding: 0 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {BRAND_SAND}; border-radius: 8px;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 15px 12px; text-align: left; color: #8C6D56; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid {BRAND_COCOA}33;">Product</th>
                                                <th style="padding: 15px 12px; text-align: center; color: #8C6D56; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid {BRAND_COCOA}33;">Qty</th>
                                                <th style="padding: 15px 12px; text-align: right; color: #8C6D56; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid {BRAND_COCOA}33;">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items_html}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <!-- SUMMARY -->
                            <tr>
                                <td style="padding: 20px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 5px 0; color: #8C6D56; font-size: 14px;">Subtotal</td>
                                            <td style="padding: 5px 0; text-align: right; color: {BRAND_COCOA}; font-size: 14px; font-weight: bold;">{format_inr(subtotal)}</td>
                                        </tr>
                                        {f'''<tr>
                                            <td style="padding: 5px 0; color: {BRAND_BLUSH}; font-size: 14px;">Discount</td>
                                            <td style="padding: 5px 0; text-align: right; color: {BRAND_BLUSH}; font-size: 14px; font-weight: bold;">-{format_inr(discount)}</td>
                                        </tr>''' if discount > 0 else ''}
                                        <tr>
                                            <td style="padding: 5px 0; color: #8C6D56; font-size: 14px;">Shipping</td>
                                            <td style="padding: 5px 0; text-align: right; color: {BRAND_COCOA}; font-size: 14px; font-weight: bold;">{format_inr(shipping)}</td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" style="padding-top: 15px; border-bottom: 1px solid {BRAND_SAND};"></td>
                                        </tr>
                                        <tr>
                                            <td style="padding-top: 15px; color: {BRAND_COCOA}; font-size: 18px; font-weight: 900; text-transform: uppercase;">Grand Total</td>
                                            <td style="padding-top: 15px; text-align: right; color: {BRAND_BLUSH}; font-size: 20px; font-weight: 900;">{format_inr(grand_total)}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- SHIPPING DETAILS & DELIVERY -->
                            <tr>
                                <td style="padding: 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td width="50%" valign="top">
                                                <h3 style="margin: 0 0 10px 0; color: {BRAND_COCOA}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h3>
                                                {address_html}
                                            </td>
                                            <td width="50%" valign="top" style="text-align: right;">
                                                <h3 style="margin: 0 0 10px 0; color: {BRAND_COCOA}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Delivery</h3>
                                                <p style="margin: 0; color: #8C6D56; font-size: 13px; line-height: 1.5;">
                                                    Your order will be shipped via our delivery partners soon.<br>
                                                    We will send you the tracking link once it is dispatched!
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 30px; background-color: {BRAND_SAND}; text-align: center; border-top: 1px solid #E5DFD5;">
                                    <h4 style="margin: 0 0 10px 0; font-family: {HEADER_FONT}; color: {BRAND_COCOA}; font-size: 18px; font-style: italic;">Lil Viaa</h4>
                                    <p style="margin: 0 0 15px 0; color: #8C6D56; font-size: 12px;">
                                        Mettupalayam Bus Stop, P.N. Road,<br>
                                        Tiruppur, Tamil Nadu - 644604<br>
                                        Lilviaa.byutsav@gmail.com
                                    </p>
                                    <p style="margin: 0; font-size: 12px;">
                                        <a href="https://lilviaaa.com/shipping-policy" style="color: {BRAND_BLUSH}; text-decoration: none; margin: 0 10px;">Shipping Policy</a> |
                                        <a href="https://lilviaaa.com/return-policy" style="color: {BRAND_BLUSH}; text-decoration: none; margin: 0 10px;">Return Policy</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        send_mail(
            to=to_email,
            subject=f"Order Confirmed - #{short_order_id} - Lil Viaa",
            html_body=html
        )
    except Exception as e:
        logger.error(f"Error in send_customer_order_confirmation for order {order.get('id')}: {str(e)}")


def send_owner_order_notification(order: dict):
    try:
        config = get_smtp_config()
        to_email = config["owner_email"]
        
        if not to_email:
            logger.warning("No OWNER_EMAIL configured. Skipping owner notification.")
            return

        order_id = str(order.get("id"))
        short_order_id = order_id.split("-")[0].upper()
        grand_total = float(order.get("total_amount", order.get("grand_total", 0)))
        
        address_info = order.get("addresses", {})
        if not address_info:
            address_info = {
                "full_name": order.get("full_name", ""),
                "phone": order.get("phone", "")
            }
            
        customer_name = address_info.get("full_name", "Unknown")
        customer_phone = address_info.get("phone", "Unknown")
        
        payment_method = str(order.get("payment_method", "unknown")).upper()
        
        items = order.get("items", []) or order.get("order_items", [])
        num_items = sum(int(item.get("quantity", item.get("qty", 1))) for item in items)
        
        # Link to admin dashboard
        admin_link = f"https://lilviaaa.com/admin/orders/{order_id}"

        plain_text = f"""New Order Received!
        
Order ID: {short_order_id}
Customer Name: {customer_name}
Customer Phone: {customer_phone}
Payment Method: {payment_method}
Total Amount: ₹{grand_total:,.2f}
Number of Items: {num_items}

View order in dashboard:
{admin_link}
"""

        send_mail(
            to=to_email,
            subject=f"New Order #{short_order_id} — ₹{grand_total:,.2f}",
            plain_body=plain_text,
            html_body=None
        )
    except Exception as e:
        logger.error(f"Error in send_owner_order_notification for order {order.get('id')}: {str(e)}")
