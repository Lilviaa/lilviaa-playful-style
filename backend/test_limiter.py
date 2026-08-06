import asyncio
from fastapi import Request
from app.core.limiter import PreAuthRateLimit
import traceback

async def run():
    req = Request({
        "type": "http",
        "path": "/api/v1/sync",
        "headers": [(b"host", b"localhost"), (b"x-forwarded-for", b"1.2.3.4")],
        "client": ("127.0.0.1", 8000)
    })
    limit = PreAuthRateLimit("5/minute")
    try:
        limit(req)
        print("Success!")
    except Exception as e:
        traceback.print_exc()

asyncio.run(run())
