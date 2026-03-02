from __future__ import annotations

from src.rules.date_rules import DateNormalizer
from src.rules.duplicate_detection import DuplicateDetector
from src.rules.name_rules import NameNormalizer
from src.rules.place_rules import PlaceNormalizer


def test_name_normalization_particle_removed() -> None:
    out = NameNormalizer.normalize("PIETRO", "d'agostino")
    assert out["given_names"] == "Pietro"
    assert out["family_name"] == "Agostino"


def test_date_gedcom_parsing() -> None:
    out = DateNormalizer.normalize("15 MAR 1500")
    assert out["date"] == "1500-03-15"
    assert out["precision"] == "day"


def test_place_mapping() -> None:
    out = PlaceNormalizer.normalize("Palermo")
    assert out["place"] == "Palermo, Sicilia, Italia"


def test_duplicate_similarity() -> None:
    sim = DuplicateDetector.similarity("Pietro Giardina", "Pietro Giardina")
    assert sim == 1.0

