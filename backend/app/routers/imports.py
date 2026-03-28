import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.import_record import ImportRecord
from app.models.transaction import Transaction
from app.services.import_service import parse_csv, parse_xlsx
from app.services.dedup_service import find_duplicates_in_batch, check_duplicate

router = APIRouter(prefix="/api/imports", tags=["imports"])


@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...),
    account_id: int = Form(...),
    db: Session = Depends(get_db),
):
    """Parse file and return preview without committing to DB."""
    content = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            transactions = parse_csv(content, account_id)
        elif filename.endswith((".xlsx", ".xls")):
            transactions = parse_xlsx(content, account_id)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV or XLSX.")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Check duplicates within batch and against DB
    existing = db.query(Transaction).filter(Transaction.account_id == account_id).all()
    is_dup = find_duplicates_in_batch(transactions, existing)

    preview = []
    for i, t in enumerate(transactions):
        preview.append({
            **t,
            "is_duplicate": is_dup[i],
            "original_data": t.get("original_data", {}),
        })

    return {
        "total": len(transactions),
        "duplicates": sum(is_dup),
        "new": sum(1 for d in is_dup if not d),
        "transactions": preview,
    }


@router.post("/commit")
async def commit_import(
    file: UploadFile = File(...),
    account_id: int = Form(...),
    skip_duplicates: bool = Form(True),
    db: Session = Depends(get_db),
):
    """Parse file and commit non-duplicate transactions to DB."""
    content = await file.read()
    filename = file.filename
    file_type = "xlsx" if filename.lower().endswith((".xlsx", ".xls")) else "csv"

    try:
        if file_type == "csv":
            transactions = parse_csv(content, account_id)
        else:
            transactions = parse_xlsx(content, account_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    existing = db.query(Transaction).filter(Transaction.account_id == account_id).all()
    is_dup = find_duplicates_in_batch(transactions, existing)

    import_record = ImportRecord(
        filename=filename,
        file_type=file_type,
        account_id=account_id,
        total_rows=len(transactions),
        status="pending",
    )
    db.add(import_record)
    db.flush()

    imported = 0
    duplicates = 0
    for i, t in enumerate(transactions):
        if is_dup[i]:
            duplicates += 1
            if skip_duplicates:
                continue
        db_t = Transaction(
            date=t["date"],
            amount=t["amount"],
            description=t["description"],
            account_id=account_id,
            status=t.get("status", "posted"),
            transaction_type=t.get("transaction_type", "debit"),
            is_duplicate=is_dup[i],
            import_id=import_record.id,
        )
        db.add(db_t)
        imported += 1

    import_record.imported_rows = imported
    import_record.duplicate_rows = duplicates
    import_record.status = "completed"
    db.commit()

    return {
        "import_id": import_record.id,
        "total": len(transactions),
        "imported": imported,
        "duplicates": duplicates,
        "status": "completed",
    }


@router.get("/")
def list_imports(db: Session = Depends(get_db)):
    return db.query(ImportRecord).order_by(ImportRecord.created_at.desc()).all()
