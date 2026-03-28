import io
import csv
from app.services.import_service import parse_csv, parse_xlsx


def make_csv(rows):
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode()


def test_parse_csv_basic():
    content = make_csv([
        {"Date": "2024-01-01", "Amount": "-50.00", "Description": "Grocery"},
        {"Date": "2024-01-02", "Amount": "1000.00", "Description": "Paycheck"},
    ])
    transactions = parse_csv(content)
    assert len(transactions) == 2
    assert transactions[0]["amount"] == -50.0
    assert transactions[0]["description"] == "Grocery"
    assert transactions[1]["amount"] == 1000.0
    assert transactions[1]["transaction_type"] == "credit"


def test_parse_csv_currency_format():
    """Test parsing amounts with $ and commas."""
    content = make_csv([
        {"Date": "2024-01-01", "Amount": "$1,234.56", "Description": "Big Purchase"},
    ])
    transactions = parse_csv(content)
    assert transactions[0]["amount"] == 1234.56


def test_parse_csv_negative_parentheses():
    """Test parsing negative amounts in parentheses like (50.00)."""
    content = make_csv([
        {"Date": "2024-01-01", "Amount": "(50.00)", "Description": "Debit"},
    ])
    transactions = parse_csv(content)
    assert transactions[0]["amount"] == -50.0


def test_parse_csv_column_aliases():
    """Test that column aliases are normalized."""
    content = make_csv([
        {"Transaction Date": "2024-01-01", "Transaction Amount": "-25.00", "Memo": "Test"},
    ])
    transactions = parse_csv(content)
    assert len(transactions) == 1
    assert transactions[0]["amount"] == -25.0


def test_parse_csv_missing_columns():
    content = b"foo,bar\n1,2\n"
    try:
        parse_csv(content)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Missing required columns" in str(e)


def test_transaction_type_debit():
    content = make_csv([
        {"Date": "2024-01-01", "Amount": "-50.00", "Description": "Coffee"},
    ])
    transactions = parse_csv(content)
    assert transactions[0]["transaction_type"] == "debit"


def test_transaction_type_credit():
    content = make_csv([
        {"Date": "2024-01-01", "Amount": "1000.00", "Description": "Paycheck"},
    ])
    transactions = parse_csv(content)
    assert transactions[0]["transaction_type"] == "credit"
