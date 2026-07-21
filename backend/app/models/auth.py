from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


def _validate_password(v: str) -> str:
    """Enforce minimum password security: at least 8 characters, not whitespace-only."""
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if v != v.strip():
        raise ValueError("Password cannot have leading or trailing whitespace")
    if not any(c.isdigit() or not c.isalpha() for c in v):
        # At least one non-alpha character (digit or symbol) for basic complexity
        raise ValueError("Password must contain at least one number or special character")
    return v


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    full_name: str
    phone: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Editable profile fields — all optional, only provided fields get updated.
    Note: email changes are blocked at the service layer until a verified
    email-change flow is implemented.
    """
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, v: str) -> str:
        return _validate_password(v)
