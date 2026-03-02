from __future__ import annotations

import re
from datetime import datetime


class DateNormalizer:
    MONTHS = {
        "JAN": 1,
        "FEB": 2,
        "MAR": 3,
        "APR": 4,
        "MAY": 5,
        "JUN": 6,
        "JUL": 7,
        "AUG": 8,
        "SEP": 9,
        "OCT": 10,
        "NOV": 11,
        "DEC": 12,
    }

    @staticmethod
    def normalize(date_str: str) -> dict:
        if not date_str:
            return {"date": None, "precision": None, "modifiers": [], "confidence": 0.0, "changes": []}

        src = date_str.strip()
        upper = src.upper()
        changes: list[str] = []
        modifiers: list[str] = []

        if any(token in upper for token in ["CA", "CIRCA", "ABT", "~", "?"]):
            modifiers.append("approximate")
            changes.append("approximation_detected")

        m_iso = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", src)
        if m_iso:
            return {"date": src, "precision": "day", "modifiers": modifiers, "confidence": 0.98, "changes": changes}

        m_year = re.match(r".*?(\d{4}).*", src)
        if m_year and len(src) <= 12:
            return {"date": m_year.group(1), "precision": "year", "modifiers": modifiers, "confidence": 0.85, "changes": changes}

        m_ged = re.match(r"^(\d{1,2}) ([A-Z]{3}) (\d{4})$", upper)
        if m_ged and m_ged.group(2) in DateNormalizer.MONTHS:
            day = int(m_ged.group(1))
            month = DateNormalizer.MONTHS[m_ged.group(2)]
            year = int(m_ged.group(3))
            iso = datetime(year, month, day).strftime("%Y-%m-%d")
            changes.append("gedcom_date_parsed")
            return {"date": iso, "precision": "day", "modifiers": modifiers, "confidence": 0.92, "changes": changes}

        return {"date": None, "precision": None, "modifiers": modifiers, "confidence": 0.25, "changes": changes + ["unparsed_date"]}

