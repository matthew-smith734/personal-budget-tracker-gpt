from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class ImportRecord(Base):
    __tablename__ = "import_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # csv, xlsx
    account_id = Column(Integer, nullable=True)
    total_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    duplicate_rows = Column(Integer, default=0)
    skipped_rows = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, completed, failed
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    transactions = relationship("Transaction", back_populates="import_record")


class ImportedTransaction(Base):
    __tablename__ = "imported_transactions"

    id = Column(Integer, primary_key=True, index=True)
    import_id = Column(Integer, nullable=True)
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    original_data = Column(JSON, nullable=True)
    is_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
