def get_ip(x_forwarded_for: str):
    if not x_forwarded_for:
        return None
    ips = [ip.strip() for ip in x_forwarded_for.split(',')]
    # If we expect 2 trusted proxies (Vercel, Render)
    trusted_proxies_count = 2
    if len(ips) >= trusted_proxies_count:
        return ips[-trusted_proxies_count]
    else:
        # Fallback if fewer hops exist (e.g. local dev or direct connection)
        return ips[0]

print("Spoof, Client, Vercel ->", get_ip("1.1.1.1, 2.2.2.2, 3.3.3.3"))
print("Client, Vercel ->", get_ip("2.2.2.2, 3.3.3.3"))
print("Direct Client ->", get_ip("2.2.2.2"))
print("Empty ->", get_ip(""))
