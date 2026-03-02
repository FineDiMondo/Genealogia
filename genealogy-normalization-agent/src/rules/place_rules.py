from __future__ import annotations

import re


class PlaceNormalizer:
    PLACE_MAP = {
        "PALERMO, SICILIA": "Palermo, Sicilia, Italia",
        "PALERMO": "Palermo, Sicilia, Italia",
        "BERGAMO": "Bergamo, Lombardia, Italia",
    }

    @staticmethod
    def normalize(place: str) -> dict:
        if not place:
            return {"place": None, "confidence": 0.0, "changes": []}
        src = re.sub(r"\s+", " ", place.strip())
        key = src.upper()
        if key in PlaceNormalizer.PLACE_MAP:
            return {"place": PlaceNormalizer.PLACE_MAP[key], "confidence": 0.95, "changes": ["place_map_match"]}
        return {"place": src.title(), "confidence": 0.75, "changes": ["title_case"]}

