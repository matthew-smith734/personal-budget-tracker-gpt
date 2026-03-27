import io
import csv
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.transaction import Transaction

router = APIRouter(prefix="/api/exports", tags=["exports"])


@router.get("/transactions/csv")
def export_transactions_csv(
    account_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Export transactions as CSV."""
    query = db.query(Transaction).filter(Transaction.is_duplicate == False)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    transactions = query.order_by(Transaction.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Amount", "Description", "Account ID", "Category ID",
                     "Envelope ID", "Status", "Type", "Notes"])
    for t in transactions:
        writer.writerow([
            t.id, t.date.isoformat(), t.amount, t.description, t.account_id,
            t.category_id, t.envelope_id, t.status, t.transaction_type, t.notes
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.get("/transactions/xlsx")
def export_transactions_xlsx(
    account_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Export transactions as XLSX."""
    import pandas as pd

    query = db.query(Transaction).filter(Transaction.is_duplicate == False)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    transactions = query.order_by(Transaction.date.desc()).all()

    data = [{
        "ID": t.id, "Date": t.date, "Amount": t.amount, "Description": t.description,
        "Account ID": t.account_id, "Category ID": t.category_id,
        "Envelope ID": t.envelope_id, "Status": t.status, "Type": t.transaction_type,
        "Notes": t.notes,
    } for t in transactions]

    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transactions.xlsx"},
    )
