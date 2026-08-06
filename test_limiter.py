import asyncio
from fastapi import Request
from app.core.limiter import PreAuthRateLimit

async def run():
    req = Request({"type": "http", "headers": [(b"host", b"localhost")], "client": ("127.0.0.1", 8000)})
    limit = PreAuthRateLimit("5/minute")
    try:
        limit(req)
        print("Success")
    except Exception as e:
        print("Exception:", str(e))

asyncio.run(run())
