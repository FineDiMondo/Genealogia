from __future__ import annotations

from pydantic import BaseModel, Field


class PersonIn(BaseModel):
    person_id: str | None = None
    given_names: str = ""
    family_name: str = ""
    birth_date: str | None = None
    birth_place: str | None = None
    death_date: str | None = None
    death_place: str | None = None
    parents: list[str] = Field(default_factory=list)
    spouse: list[str] = Field(default_factory=list)
    children: list[str] = Field(default_factory=list)
    source_id: str | None = None


class BatchIn(BaseModel):
    source: str = "api"
    records: list[PersonIn]


class DashboardHistoryIn(BaseModel):
    start_date: str
    end_date: str
    export_format: str = "json"
