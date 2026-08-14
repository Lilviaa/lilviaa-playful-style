from fastapi import APIRouter, Query, Request, Depends
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit

router = APIRouter()

@router.get("/check-pincode", dependencies=[Depends(PreAuthRateLimit("10/minute"))])
@limiter.limit("10/minute")
async def check_pincode(
    request: Request,
    pincode: str = Query(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
):
    """
    Check if Shiprocket can deliver to a given Indian pincode.
    Rate limited to 10 requests per minute per IP to prevent abuse.
    """
    from app.services.shiprocket import get_serviceability
    import os

    pickup_pincode = os.environ.get("SHIPROCKET_PICKUP_PINCODE", "600001")

    try:
        data = await get_serviceability(
            pickup_pincode=pickup_pincode,
            delivery_pincode=pincode,
            weight=0.5,  # Default: 0.5kg per order (sufficient for kids clothing)
            cod=0         # Prepaid only
        )

        couriers = data.get("data", {}).get("available_courier_companies", [])
        is_serviceable = len(couriers) > 0

        # Get the fastest estimated delivery from available couriers
        estimated_days = None
        city = None
        state = None

        if is_serviceable:
            # Get city/state from first available courier's data
            recommended = data.get("data", {}).get("shiprocket_recommended_courier_id")
            for c in couriers:
                if c.get("estimated_delivery_days"):
                    try:
                        days = int(c["estimated_delivery_days"])
                        if estimated_days is None or days < estimated_days:
                            estimated_days = days
                    except (ValueError, TypeError):
                        pass

            # Try to get city/state from serviceability response
            city = data.get("data", {}).get("city") or None
            state = data.get("data", {}).get("state") or None

        return {
            "is_serviceable": is_serviceable,
            "estimated_delivery_days": estimated_days,
            "city": city,
            "state": state,
        }

    except AppError:
        # Shiprocket returned an error for this pincode — treat as not serviceable
        return {
            "is_serviceable": False,
            "estimated_delivery_days": None,
            "city": None,
            "state": None,
        }
    except Exception as e:
        raise AppError(f"Failed to check serviceability: {str(e)}", 500)
