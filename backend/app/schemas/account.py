from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AccountBase(BaseModel):
    name: str
    account_type: str = "checking"
    balance: float = 0.0
    currency: str = "USD"
    is_active: bool = True
    notes: Optional[str] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class AccountResponse(AccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
