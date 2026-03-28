import io
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional
from dateutil import parser as date_parser


COLUMN_ALIASES = {
    "date": ["date", "transaction date", "trans date", "posting date", "value date", "settlement date"],
    "amount": ["amount", "transaction amount", "debit", "credit", "value"],
    "description": ["description", "memo", "payee", "narrative", "details", "merchant", "transaction description"],
}


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names to standard format."""
    col_map = {}
    for col in df.columns:
        col_lower = col.lower().strip()
        for standard, aliases in COLUMN_ALIASES.items():
            if col_lower in aliases and standard not in col_map.values():
                col_map[col] = standard
                break
    return df.rename(columns=col_map)


def _parse_amount(value: Any) -> float:
    """Parse amount strings like '$1,234.56' or '(1,234.56)' (negative)."""
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", "").replace("$", "").replace(" ", "")
    if s.startswith("(") and s.endswith(")"):
        return -float(s[1:-1])
    if s.startswith("-"):
        return -float(s[1:])
    return float(s)


def _parse_date(value: Any) -> datetime:
    """Parse date strings using dateutil."""
    if isinstance(value, datetime):
        return value
    if isinstance(value, pd.Timestamp):
        return value.to_pydatetime()
    return date_parser.parse(str(value))


def parse_csv(content: bytes, account_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Parse CSV file and return list of normalized transactions."""
    df = pd.read_csv(io.BytesIO(content))
    return _process_dataframe(df)


def parse_xlsx(content: bytes, account_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Parse XLSX file and return list of normalized transactions."""
    df = pd.read_excel(io.BytesIO(content))
    return _process_dataframe(df)


def _process_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Process a dataframe and return normalized transaction dicts."""
    df = _normalize_columns(df)
    df.columns = [c.lower().strip() for c in df.columns]

    required = {"date", "amount", "description"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}. Available: {list(df.columns)}")

    transactions = []
    errors = []
    for idx, row in df.iterrows():
        try:
            amount = _parse_amount(row["amount"])
            date = _parse_date(row["date"])
            description = str(row["description"]).strip()
            transactions.append({
                "date": date,
                "amount": amount,
                "description": description,
                "transaction_type": "credit" if amount > 0 else "debit",
                "status": "posted",
                "original_data": row.to_dict(),
            })
        except Exception as e:
            errors.append({"row": idx, "error": str(e)})

    return transactions
