from pydantic import BaseModel, computed_field
from typing import Optional
from datetime import datetime


class EnvelopeBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    budgeted_amount: float = 0.0
    period: str = "monthly"
    notes: Optional[str] = None


class EnvelopeCreate(EnvelopeBase):
    pass


class EnvelopeUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    budgeted_amount: Optional[float] = None
    period: Optional[str] = None
    notes: Optional[str] = None


class EnvelopeResponse(EnvelopeBase):
    id: int
    spent_amount: float
    available_amount: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
