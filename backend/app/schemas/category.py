from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: Optional[str] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
