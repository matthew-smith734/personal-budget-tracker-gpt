from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TransactionBase(BaseModel):
    date: datetime
    amount: float
    description: str
    account_id: int
    category_id: Optional[int] = None
    envelope_id: Optional[int] = None
    status: str = "posted"
    transaction_type: str = "debit"
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    envelope_id: Optional[int] = None
    status: Optional[str] = None
    transaction_type: Optional[str] = None
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    is_duplicate: bool
    import_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
