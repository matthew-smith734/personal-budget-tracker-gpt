from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    account_type = Column(String, default="checking")  # checking, savings, credit, cash
    balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    is_active = Column(Boolean, default=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="account")
