from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Envelope(Base):
    __tablename__ = "envelopes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    budgeted_amount = Column(Float, default=0.0)
    spent_amount = Column(Float, default=0.0)
    period = Column(String, default="monthly")  # monthly, weekly, yearly, one-time
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="envelopes")
    transactions = relationship("Transaction", back_populates="envelope")

    @property
    def available_amount(self):
        return self.budgeted_amount - self.spent_amount
