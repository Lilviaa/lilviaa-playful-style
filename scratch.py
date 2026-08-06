import os
import re

files = [
    "backend/app/api/v1/admin_reviews.py",
    "backend/app/api/v1/admin_cms.py",
    "backend/app/api/v1/admin_banners.py",
    "backend/app/api/v1/admin_coupons.py",
    "backend/app/api/v1/admin_customers.py",
    "backend/app/api/v1/admin_dashboard.py",
]

imports = """
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id
from fastapi import Request
"""

for fpath in files:
    with open(fpath, "r") as f:
        content = f.read()

    # Add imports
    if "from app.core.limiter" not in content:
        content = content.replace("from fastapi import APIRouter", "from fastapi import APIRouter, Request\nfrom app.core.limiter import limiter, PreAuthRateLimit, get_admin_id")

    # We need to find @router.xxx(...) and add dependencies and limiter.
    def replacer(match):
        method = match.group(1) # get, post, put, delete, patch
        route_path = match.group(2)
        full_match = match.group(0)

        # Determine limit based on method
        if method.lower() == "get":
            limit = "60/minute"
        elif "upload" in route_path:
            limit = "15/minute"
        else:
            limit = "30/minute"

        if "dependencies=[" in full_match:
            # We already have dependencies, append to it. This is hard via regex.
            # Let's just append to the router definition if it doesn't have it, or do it simply:
            pass
        
        # Better: just inject right after the @router.xxx(...) line
        # but we also need to add `request: Request` to the function args.
        pass

