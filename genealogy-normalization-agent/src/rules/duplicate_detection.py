from __future__ import annotations


def _levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        curr = [i]
        for j, cb in enumerate(b, start=1):
            ins = curr[j - 1] + 1
            delete = prev[j] + 1
            repl = prev[j - 1] + (0 if ca == cb else 1)
            curr.append(min(ins, delete, repl))
        prev = curr
    return prev[-1]


class DuplicateDetector:
    @staticmethod
    def similarity(name_a: str, name_b: str) -> float:
        a = (name_a or "").lower().strip()
        b = (name_b or "").lower().strip()
        if not a and not b:
            return 1.0
        dist = _levenshtein(a, b)
        return max(0.0, 1 - (dist / max(len(a), len(b), 1)))

    @staticmethod
    def detect(records: list[dict], threshold: float = 0.92) -> list[dict]:
        duplicates: list[dict] = []
        for i in range(len(records)):
            for j in range(i + 1, len(records)):
                n1 = f"{records[i].get('given_names','')} {records[i].get('family_name','')}".strip()
                n2 = f"{records[j].get('given_names','')} {records[j].get('family_name','')}".strip()
                sim = DuplicateDetector.similarity(n1, n2)
                if sim >= threshold:
                    duplicates.append({"a": records[i].get("person_id"), "b": records[j].get("person_id"), "similarity": round(sim, 4)})
        return duplicates

