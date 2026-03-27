from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("/", response_model=List[AccountResponse])
def list_accounts(db: Session = Depends(get_db)):
    return db.query(Account).filter(Account.is_active == True).all()


@router.post("/", response_model=AccountResponse, status_code=201)
def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    db_account = Account(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, account_update: AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, value in account_update.model_dump(exclude_unset=True).items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_active = False
    db.commit()
