"""
Data Normalization Engine
Core orchestration for genealogical data cleaning and normalization
"""

import json
import asyncio
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import anthropic

# ============================================================================
# DATA MODELS
# ============================================================================

class ConfidenceLevel(Enum):
    """Confidence scoring levels"""
    VERY_LOW = 0.0
    LOW = 0.25
    MEDIUM = 0.50
    HIGH = 0.75
    VERY_HIGH = 0.95

class ConflictSeverity(Enum):
    """Conflict severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class NormalizationChange:
    """Track a single normalization change"""
    field: str
    original_value: str
    normalized_value: str
    rule_applied: str
    confidence: float
    sources: List[str]
    rationale: str

@dataclass
class SourceAttribution:
    """Track source of a normalized value"""
    source_system: str  # "Ancestry", "FamilySearch", "Local", etc
    source_id: str      # Tree ID, file ID, etc
    original_value: str
    confidence: float
    date_extracted: str

@dataclass
class NormalizedPerson:
    """A normalized genealogical record"""
    person_id: str
    
    # Names
    given_names: str
    family_name: str
    name_variants: List[str]
    
    # Birth
    birth_date: Optional[str]  # ISO format or "YYYY"
    birth_place: Optional[str]  # Normalized place
    
    # Death
    death_date: Optional[str]
    death_place: Optional[str]
    
    # Relationships
    parents: List[str]  # Person IDs
    spouse: List[str]
    children: List[str]
    
    # Metadata
    sources: List[SourceAttribution]
    changes: List[NormalizationChange]
    confidence: float  # 0-1, auto-approve threshold 0.85
    flagged_for_review: bool
    conflict_reasons: List[str]
    audit_id: str
    processed_at: str

# ============================================================================
# NORMALIZATION ENGINE
# ============================================================================

class DataNormalizationEngine:
    """
    Main orchestration engine for data normalization
    Uses Claude API for intelligent cleaning
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize engine with Claude API"""
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"
        self.auto_approve_threshold = 0.85
        self.changes_log = []
    
    async def normalize_batch(
        self,
        records: List[Dict],
        sources: List[str],
        threshold: float = 0.85
    ) -> Tuple[List[NormalizedPerson], List[Dict]]:
        """
        Normalize a batch of genealogical records
        
        Args:
            records: List of raw person records (GEDCOM/JSON)
            sources: Source systems (Ancestry, FamilySearch, etc)
            threshold: Confidence threshold for auto-approval (0.85 default)
        
        Returns:
            Tuple of (normalized_records, flagged_conflicts)
        """
        self.auto_approve_threshold = threshold
        normalized = []
        conflicts = []
        
        for record in records:
            # Normalize individual record
            norm_person = await self._normalize_person(record, sources)
            normalized.append(norm_person)
            
            # Flag if below threshold
            if norm_person.confidence < self.auto_approve_threshold:
                conflicts.append({
                    "person_id": norm_person.person_id,
                    "confidence": norm_person.confidence,
                    "reasons": norm_person.conflict_reasons,
                    "changes": [asdict(c) for c in norm_person.changes]
                })
        
        return normalized, conflicts
    
    async def _normalize_person(
        self,
        raw_record: Dict,
        sources: List[str]
    ) -> NormalizedPerson:
        """Normalize a single person record using Claude"""
        
        # Create normalization prompt
        prompt = self._build_normalization_prompt(raw_record, sources)
        
        # Call Claude API
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        # Parse response
        normalized = self._parse_claude_response(
            response.content[0].text,
            raw_record,
            sources
        )
        
        return normalized
    
    def _build_normalization_prompt(
        self,
        record: Dict,
        sources: List[str]
    ) -> str:
        """Build the normalization prompt for Claude"""
        
        return f"""
You are an expert genealogist data curator. Normalize this genealogical record.

RECORD TO NORMALIZE:
{json.dumps(record, indent=2)}

SOURCES:
{', '.join(sources)}

TASK:
1. Normalize names (given_names, family_name)
2. Standardize dates (YYYY-MM-DD or YYYY format)
3. Normalize places (add modern names if historical)
4. Validate relationships
5. Score confidence (0-1)
6. Flag any conflicts or issues

OUTPUT FORMAT (JSON):
{{
  "given_names": "normalized",
  "family_name": "normalized",
  "name_variants": ["variant1", "variant2"],
  "birth_date": "YYYY-MM-DD or YYYY",
  "birth_place": "Place, Region, Country",
  "death_date": "YYYY-MM-DD or YYYY",
  "death_place": "Place, Region, Country",
  "confidence": 0.95,
  "changes": [
    {{
      "field": "family_name",
      "original": "original_value",
      "normalized": "normalized_value",
      "rule": "rule_name",
      "rationale": "why this change"
    }}
  ],
  "conflicts": [],
  "notes": "any important notes"
}}

RULES:
- Names: Remove particles (d', di, da, von, van). Standardize capitalization.
- Dates: Parse formats: "ca 1500", "~1505", "1500?", "1500-03-15"
- Places: Modern names, geocode if possible, track variants
- Confidence: High (0.85+) = auto-approve. Low = flag for review
- Be conservative: If unsure, lower confidence score

Respond ONLY with valid JSON.
"""
    
    def _parse_claude_response(
        self,
        response_text: str,
        raw_record: Dict,
        sources: List[str]
    ) -> NormalizedPerson:
        """Parse Claude's JSON response into NormalizedPerson"""
        
        try:
            data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if response isn't valid JSON
            data = {
                "given_names": raw_record.get("given_names", ""),
                "family_name": raw_record.get("family_name", ""),
                "confidence": 0.5,
                "changes": [],
                "conflicts": []
            }
        
        # Build changes list
        changes = []
        for change in data.get("changes", []):
            changes.append(NormalizationChange(
                field=change.get("field", ""),
                original_value=change.get("original", ""),
                normalized_value=change.get("normalized", ""),
                rule_applied=change.get("rule", ""),
                confidence=data.get("confidence", 0.5),
                sources=sources,
                rationale=change.get("rationale", "")
            ))
        
        # Build source attribution
        source_attrib = [
            SourceAttribution(
                source_system=s,
                source_id=raw_record.get(f"{s.lower()}_id", ""),
                original_value=raw_record.get("family_name", ""),
                confidence=data.get("confidence", 0.5),
                date_extracted=datetime.now().isoformat()
            )
            for s in sources
        ]
        
        # Determine if flagged
        confidence = data.get("confidence", 0.5)
        flagged = confidence < self.auto_approve_threshold or bool(data.get("conflicts"))
        
        return NormalizedPerson(
            person_id=raw_record.get("id", f"PERS-{datetime.now().timestamp()}"),
            given_names=data.get("given_names", ""),
            family_name=data.get("family_name", ""),
            name_variants=data.get("name_variants", []),
            birth_date=data.get("birth_date"),
            birth_place=data.get("birth_place"),
            death_date=data.get("death_date"),
            death_place=data.get("death_place"),
            parents=raw_record.get("parents", []),
            spouse=raw_record.get("spouse", []),
            children=raw_record.get("children", []),
            sources=source_attrib,
            changes=changes,
            confidence=confidence,
            flagged_for_review=flagged,
            conflict_reasons=data.get("conflicts", []),
            audit_id=f"AUDIT-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            processed_at=datetime.now().isoformat()
        )

# ============================================================================
# DUPLICATE DETECTION
# ============================================================================

class DuplicateDetector:
    """Detect and score potential duplicates"""
    
    def __init__(self, similarity_threshold: float = 0.85):
        self.similarity_threshold = similarity_threshold
    
    def find_duplicates(self, records: List[NormalizedPerson]) -> List[Dict]:
        """Find potential duplicates in record set"""
        duplicates = []
        
        for i, record1 in enumerate(records):
            for record2 in records[i+1:]:
                similarity = self._calculate_similarity(record1, record2)
                
                if similarity >= self.similarity_threshold:
                    duplicates.append({
                        "record1_id": record1.person_id,
                        "record2_id": record2.person_id,
                        "similarity": similarity,
                        "matching_fields": self._find_matching_fields(record1, record2),
                        "merge_recommendation": self._recommend_merge(record1, record2)
                    })
        
        return duplicates
    
    def _calculate_similarity(
        self,
        record1: NormalizedPerson,
        record2: NormalizedPerson
    ) -> float:
        """Calculate similarity score between two records (0-1)"""
        
        scores = []
        
        # Name similarity (40% weight)
        name_sim = self._string_similarity(
            f"{record1.given_names} {record1.family_name}",
            f"{record2.given_names} {record2.family_name}"
        )
        scores.append(("name", name_sim, 0.40))
        
        # Birth date similarity (30% weight)
        date_sim = 1.0 if record1.birth_date == record2.birth_date else (
            0.7 if self._date_proximity(record1.birth_date, record2.birth_date, years=5) else 0.0
        )
        scores.append(("birth_date", date_sim, 0.30))
        
        # Birth place similarity (20% weight)
        place_sim = self._string_similarity(
            record1.birth_place or "",
            record2.birth_place or ""
        )
        scores.append(("birth_place", place_sim, 0.20))
        
        # Calculate weighted average
        total_score = sum(score * weight for _, score, weight in scores)
        return total_score
    
    def _string_similarity(self, str1: str, str2: str) -> float:
        """Levenshtein-based string similarity (0-1)"""
        if not str1 or not str2:
            return 0.0
        
        # Simple implementation (can use difflib for production)
        from difflib import SequenceMatcher
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()
    
    def _date_proximity(self, date1: str, date2: str, years: int = 5) -> bool:
        """Check if dates are within N years of each other"""
        try:
            y1 = int(date1.split("-")[0]) if date1 else None
            y2 = int(date2.split("-")[0]) if date2 else None
            return abs(y1 - y2) <= years if y1 and y2 else False
        except:
            return False
    
    def _find_matching_fields(
        self,
        record1: NormalizedPerson,
        record2: NormalizedPerson
    ) -> List[str]:
        """Find which fields match between records"""
        matching = []
        
        if record1.given_names == record2.given_names:
            matching.append("given_names")
        if record1.family_name == record2.family_name:
            matching.append("family_name")
        if record1.birth_date == record2.birth_date:
            matching.append("birth_date")
        if record1.birth_place == record2.birth_place:
            matching.append("birth_place")
        
        return matching
    
    def _recommend_merge(
        self,
        record1: NormalizedPerson,
        record2: NormalizedPerson
    ) -> Dict:
        """Recommend which record to keep and how to merge"""
        
        # Keep record with higher confidence
        keep = record1 if record1.confidence >= record2.confidence else record2
        merge = record2 if keep.person_id == record1.person_id else record1
        
        return {
            "keep": keep.person_id,
            "merge_from": merge.person_id,
            "rationale": f"Keeping record with higher confidence ({keep.confidence:.2f})",
            "merge_data": {
                "name_variants": list(set(
                    keep.name_variants + merge.name_variants
                )),
                "sources": [
                    asdict(s) for s in keep.sources + merge.sources
                ]
            }
        }

# ============================================================================
# QUALITY CONTROL
# ============================================================================

class QualityControl:
    """Validate and score data quality"""
    
    @staticmethod
    def validate_relationships(person: NormalizedPerson, all_records: Dict[str, NormalizedPerson]) -> List[str]:
        """Validate family relationships"""
        issues = []
        
        for parent_id in person.parents:
            if parent_id not in all_records:
                issues.append(f"Parent {parent_id} not found in dataset")
                continue
            
            parent = all_records[parent_id]
            
            # Check age appropriateness
            if person.birth_date and parent.birth_date:
                try:
                    child_year = int(person.birth_date.split("-")[0])
                    parent_year = int(parent.birth_date.split("-")[0])
                    parent_age = child_year - parent_year
                    
                    if parent_age < 12:
                        issues.append(f"Parent {parent_id} was only {parent_age} years old - implausible")
                    elif parent_age > 70:
                        issues.append(f"Parent {parent_id} was {parent_age} years old - unusual but possible")
                except:
                    pass
        
        return issues
    
    @staticmethod
    def check_completeness(person: NormalizedPerson) -> float:
        """Score data completeness (0-1)"""
        fields_present = 0
        total_fields = 6  # given_names, family_name, birth_date, birth_place, death_date, death_place
        
        if person.given_names:
            fields_present += 1
        if person.family_name:
            fields_present += 1
        if person.birth_date:
            fields_present += 1
        if person.birth_place:
            fields_present += 1
        if person.death_date:
            fields_present += 1
        if person.death_place:
            fields_present += 1
        
        return fields_present / total_fields

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def main():
    """Example usage of the normalization engine"""
    
    engine = DataNormalizationEngine()
    
    # Example raw records
    raw_records = [
        {
            "id": "REC-001",
            "given_names": "PIETRO",
            "family_name": "D'AGOSTINO",
            "birth_date": "ca 1500",
            "birth_place": "Palermo, Sicily",
            "sources": ["Ancestry"]
        },
        {
            "id": "REC-002",
            "given_names": "Maria",
            "family_name": "Grimaldi",
            "birth_date": "~1505",
            "birth_place": "Palermo",
            "sources": ["FamilySearch"]
        }
    ]
    
    # Normalize batch
    normalized, conflicts = await engine.normalize_batch(
        records=raw_records,
        sources=["Ancestry", "FamilySearch"],
        threshold=0.85
    )
    
    # Print results
    for person in normalized:
        print(f"\n{person.family_name}, {person.given_names}")
        print(f"  Confidence: {person.confidence:.2%}")
        print(f"  Flagged: {person.flagged_for_review}")
        print(f"  Changes: {len(person.changes)}")

if __name__ == "__main__":
    asyncio.run(main())
