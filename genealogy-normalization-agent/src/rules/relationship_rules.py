from __future__ import annotations


def validate_relationships(record: dict) -> tuple[bool, list[str]]:
    issues: list[str] = []
    person_id = str(record.get("person_id", "")).strip()
    for key in ["parents", "spouse", "children"]:
        ids = record.get(key, [])
        if not isinstance(ids, list):
            issues.append(f"{key}_not_list")
            continue
        if person_id and person_id in ids:
            issues.append(f"{key}_contains_self")
    return len(issues) == 0, issues

