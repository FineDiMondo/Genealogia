from __future__ import annotations

from fastapi import FastAPI
import uvicorn

from .routes import router

app = FastAPI(title="Genealogy Data Normalization Agent", version="1.0.0")
app.include_router(router)


def main() -> None:
    uvicorn.run("src.api.server:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    main()
