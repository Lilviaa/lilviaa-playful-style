from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import status

class AppError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code

async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )

class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)

class UnauthorizedError(AppError):
    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)

class ForbiddenError(AppError):
    def __init__(self, message: str = "Not enough permissions"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)

class UnverifiedAccountError(AppError):
    """Raised when an unverified user attempts to log in."""
    def __init__(self, email: str):
        self.email = email
        super().__init__("Account not verified. Please check your email for the verification code.", status.HTTP_403_FORBIDDEN)
