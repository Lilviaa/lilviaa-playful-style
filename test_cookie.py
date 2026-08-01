from fastapi import Response

r = Response()
r.delete_cookie("access_token")
print(r.headers.getlist("set-cookie"))
