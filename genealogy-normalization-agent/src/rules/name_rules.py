from __future__ import annotations

import re


class NameNormalizer:
    PARTICLES = ["d'", "di", "da", "del", "della", "von", "van", "de", "des"]

    @staticmethod
    def normalize(given_names: str, family_name: str) -> dict:
        given = (given_names or "").strip()
        family = (family_name or "").strip()
        changes: list[str] = []
        variants = [x for x in [given_names, family_name] if x]

        # Handle "SURNAME, Given" format inside given field.
        if "," in given and not family:
            parts = [p.strip() for p in given.split(",", 1)]
            if len(parts) == 2:
                family, given = parts[0], parts[1]
                changes.append("split_comma_name_format")

        normalized_given = re.sub(r"\s+", " ", given).title()
        normalized_family = re.sub(r"\s+", " ", family).title()

        for particle in NameNormalizer.PARTICLES:
            if normalized_family.lower().startswith(particle.lower()):
                normalized_family = normalized_family[len(particle) :].strip().title()
                changes.append(f"removed_particle_{particle}")
                break

        confidence = 0.98 if not changes else 0.90
        return {
            "given_names": normalized_given,
            "family_name": normalized_family,
            "variants": list(dict.fromkeys(variants)),
            "confidence": confidence,
            "changes": changes,
        }

