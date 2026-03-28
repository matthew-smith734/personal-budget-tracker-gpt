from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.transaction import Transaction
from app.models.envelope import Envelope
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def _update_envelope_spent(db: Session, envelope_id: Optional[int], amount: float, add: bool = True):
    if envelope_id:
        envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
        if envelope:
            if add:
                envelope.spent_amount += amount
            else:
                envelope.spent_amount = max(0, envelope.spent_amount - amount)


@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    account_id: Optional[int] = None,
    category_id: Optional[int] = None,
    envelope_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.is_duplicate.is_(False))
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if envelope_id:
        query = query.filter(Transaction.envelope_id == envelope_id)
    if status:
        query = query.filter(Transaction.status == status)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    return query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = Transaction(**transaction.model_dump())
    db.add(db_transaction)
    if transaction.envelope_id and transaction.transaction_type == "debit":
        _update_envelope_spent(db, transaction.envelope_id, abs(transaction.amount))
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """Dashboard summary: total income, total expenses, net."""
    transactions = db.query(Transaction).filter(Transaction.is_duplicate.is_(False)).all()
    total_income = sum(t.amount for t in transactions if t.transaction_type == "credit")
    total_expenses = sum(abs(t.amount) for t in transactions if t.transaction_type == "debit")
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net": total_income - total_expenses,
        "transaction_count": len(transactions),
    }


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, transaction_update: TransactionUpdate, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    old_envelope_id = transaction.envelope_id
    old_amount = transaction.amount
    for key, value in transaction_update.model_dump(exclude_unset=True).items():
        setattr(transaction, key, value)
    # Adjust envelope spent amounts if envelope changed
    if old_envelope_id != transaction.envelope_id or old_amount != transaction.amount:
        _update_envelope_spent(db, old_envelope_id, abs(old_amount), add=False)
        if transaction.transaction_type == "debit":
            _update_envelope_spent(db, transaction.envelope_id, abs(transaction.amount), add=True)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.transaction_type == "debit":
        _update_envelope_spent(db, transaction.envelope_id, abs(transaction.amount), add=False)
    db.delete(transaction)
    db.commit()
