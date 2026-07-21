from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared Limiter instance.
# Import this in main.py to set app.state.limiter, and in any router that uses @limiter.limit().
# Having two separate Limiter objects would mean the app.state limiter and the decorator limiter
# are different objects, causing rate limiting to silently not work.
limiter = Limiter(key_func=get_remote_address)
