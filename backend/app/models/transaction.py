from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    envelope_id = Column(Integer, ForeignKey("envelopes.id"), nullable=True)
    status = Column(String, default="posted")  # pending, posted
    transaction_type = Column(String, default="debit")  # debit, credit
    notes = Column(String, nullable=True)
    is_duplicate = Column(Boolean, default=False)
    import_id = Column(Integer, ForeignKey("import_records.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    envelope = relationship("Envelope", back_populates="transactions")
    import_record = relationship("ImportRecord", back_populates="transactions")
