import time
import requests

def time_url(url, name):
    # Warmup
    try:
        requests.get(url, timeout=10)
    except:
        pass
    
    times = []
    for _ in range(5):
        start = time.time()
        res = requests.get(url)
        end = time.time()
        times.append((end - start) * 1000)
    
    avg = sum(times) / len(times)
    print(f"{name}: Avg {avg:.2f}ms (Times: {[int(t) for t in times]}ms)")

time_url("https://lilviaa-playful-style.onrender.com/api/v1/products/", "Product Listing")
time_url("https://lilviaa-playful-style.onrender.com/api/v1/products/sunsetorangeromper21", "Product Detail")
