from datetime import datetime
from app.services.dedup_service import find_duplicates_in_batch, _normalize_description


def make_transaction(date_str, amount, description, status="posted"):
    return {
        "date": datetime.fromisoformat(date_str),
        "amount": amount,
        "description": description,
        "status": status,
    }


def test_no_duplicates():
    txns = [
        make_transaction("2024-01-01", -50.0, "Grocery"),
        make_transaction("2024-01-02", -30.0, "Gas"),
        make_transaction("2024-01-03", -20.0, "Coffee"),
    ]
    result = find_duplicates_in_batch(txns)
    assert result == [False, False, False]


def test_exact_duplicate():
    txns = [
        make_transaction("2024-01-01", -50.0, "Grocery"),
        make_transaction("2024-01-01", -50.0, "Grocery"),
    ]
    result = find_duplicates_in_batch(txns)
    assert sum(result) == 1  # One should be marked as duplicate


def test_pending_vs_posted_duplicate():
    """Posted should be preferred over pending."""
    txns = [
        make_transaction("2024-01-01", -50.0, "Grocery", "pending"),
        make_transaction("2024-01-01", -50.0, "Grocery", "posted"),
    ]
    result = find_duplicates_in_batch(txns)
    # The pending one (index 0) should be marked as duplicate
    assert result[0] == True
    assert result[1] == False


def test_date_tolerance():
    """Transactions within 1 day should be considered duplicates."""
    txns = [
        make_transaction("2024-01-01", -50.0, "Grocery"),
        make_transaction("2024-01-02", -50.0, "Grocery"),
    ]
    result = find_duplicates_in_batch(txns, tolerance_days=1)
    assert sum(result) == 1


def test_outside_date_tolerance():
    """Transactions more than 1 day apart should NOT be duplicates."""
    txns = [
        make_transaction("2024-01-01", -50.0, "Grocery"),
        make_transaction("2024-01-05", -50.0, "Grocery"),
    ]
    result = find_duplicates_in_batch(txns, tolerance_days=1)
    assert result == [False, False]


def test_normalize_description():
    assert _normalize_description("  Hello   World  ") == "hello world"
    assert _normalize_description("AMAZON.COM") == "amazon.com"


def test_different_amounts_not_duplicate():
    txns = [
        make_transaction("2024-01-01", -50.0, "Grocery"),
        make_transaction("2024-01-01", -51.0, "Grocery"),
    ]
    result = find_duplicates_in_batch(txns)
    assert result == [False, False]
