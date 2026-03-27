from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.envelope import Envelope
from app.models.transaction import Transaction
from app.schemas.envelope import EnvelopeCreate, EnvelopeUpdate, EnvelopeResponse

router = APIRouter(prefix="/api/envelopes", tags=["envelopes"])


def _build_response(envelope: Envelope) -> dict:
    data = {
        "id": envelope.id,
        "name": envelope.name,
        "category_id": envelope.category_id,
        "budgeted_amount": envelope.budgeted_amount,
        "spent_amount": envelope.spent_amount,
        "available_amount": envelope.budgeted_amount - envelope.spent_amount,
        "period": envelope.period,
        "notes": envelope.notes,
        "created_at": envelope.created_at,
        "updated_at": envelope.updated_at,
    }
    return data


@router.get("/", response_model=List[EnvelopeResponse])
def list_envelopes(db: Session = Depends(get_db)):
    envelopes = db.query(Envelope).all()
    return [_build_response(e) for e in envelopes]


@router.post("/", response_model=EnvelopeResponse, status_code=201)
def create_envelope(envelope: EnvelopeCreate, db: Session = Depends(get_db)):
    db_envelope = Envelope(**envelope.model_dump())
    db.add(db_envelope)
    db.commit()
    db.refresh(db_envelope)
    return _build_response(db_envelope)


@router.get("/{envelope_id}", response_model=EnvelopeResponse)
def get_envelope(envelope_id: int, db: Session = Depends(get_db)):
    envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")
    return _build_response(envelope)


@router.put("/{envelope_id}", response_model=EnvelopeResponse)
def update_envelope(envelope_id: int, envelope_update: EnvelopeUpdate, db: Session = Depends(get_db)):
    envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")
    for key, value in envelope_update.model_dump(exclude_unset=True).items():
        setattr(envelope, key, value)
    db.commit()
    db.refresh(envelope)
    return _build_response(envelope)


@router.delete("/{envelope_id}", status_code=204)
def delete_envelope(envelope_id: int, db: Session = Depends(get_db)):
    envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")
    db.delete(envelope)
    db.commit()


@router.post("/{envelope_id}/assign", response_model=EnvelopeResponse)
def assign_funds(envelope_id: int, amount: float, db: Session = Depends(get_db)):
    """Assign additional funds to an envelope."""
    envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")
    envelope.budgeted_amount += amount
    db.commit()
    db.refresh(envelope)
    return _build_response(envelope)
