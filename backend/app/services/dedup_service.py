from typing import List, Dict, Any
from datetime import timedelta
from sqlalchemy.orm import Session
from app.models.transaction import Transaction


def _normalize_description(desc: str) -> str:
    """Normalize description for comparison."""
    return " ".join(desc.lower().strip().split())


def check_duplicate(
    db: Session,
    date,
    amount: float,
    description: str,
    account_id: int,
    tolerance_days: int = 1,
) -> bool:
    """
    Check if a transaction is a duplicate.

    A transaction is considered a duplicate if another transaction exists with:
    - Same account
    - Same amount (within 0.01)
    - Same normalized description
    - Date within tolerance_days
    """
    date_min = date - timedelta(days=tolerance_days)
    date_max = date + timedelta(days=tolerance_days)

    normalized_desc = _normalize_description(description)

    candidates = (
        db.query(Transaction)
        .filter(
            Transaction.account_id == account_id,
            Transaction.date >= date_min,
            Transaction.date <= date_max,
            Transaction.is_duplicate.is_(False),
        )
        .all()
    )

    for candidate in candidates:
        if (
            abs(candidate.amount - amount) < 0.01
            and _normalize_description(candidate.description) == normalized_desc
        ):
            return True

    return False


def find_duplicates_in_batch(
    transactions: List[Dict[str, Any]],
    existing_db_transactions: List[Transaction] = None,
    tolerance_days: int = 1,
) -> List[bool]:
    """
    Find duplicates within a batch of transactions and against existing DB transactions.
    Returns a list of booleans: True if the transaction at that index is a duplicate.
    """
    is_dup = [False] * len(transactions)

    # Compare within the batch
    for i, t1 in enumerate(transactions):
        if is_dup[i]:
            continue
        for j, t2 in enumerate(transactions):
            if i >= j or is_dup[j]:
                continue
            if _is_same(t1, t2, tolerance_days):
                # Keep the 'posted' one; if both same status, keep first
                if t2.get("status") == "posted" and t1.get("status") == "pending":
                    is_dup[i] = True
                else:
                    is_dup[j] = True

    # Compare against existing DB transactions
    if existing_db_transactions:
        for i, t in enumerate(transactions):
            if is_dup[i]:
                continue
            for existing in existing_db_transactions:
                if _is_same_with_db(t, existing, tolerance_days):
                    is_dup[i] = True
                    break

    return is_dup


def _is_same(t1: Dict, t2: Dict, tolerance_days: int) -> bool:
    date_diff = abs((t1["date"] - t2["date"]).days) if t1["date"] and t2["date"] else 999
    return (
        date_diff <= tolerance_days
        and abs(t1["amount"] - t2["amount"]) < 0.01
        and _normalize_description(t1["description"]) == _normalize_description(t2["description"])
    )


def _is_same_with_db(t: Dict, db_t: Transaction, tolerance_days: int) -> bool:
    if not t["date"] or not db_t.date:
        return False
    date_diff = abs((t["date"] - db_t.date).days)
    return (
        date_diff <= tolerance_days
        and abs(t["amount"] - db_t.amount) < 0.01
        and _normalize_description(t["description"]) == _normalize_description(db_t.description)
    )
