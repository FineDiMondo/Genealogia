FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV TZ=Europe/Rome

CMD ["python", "gedcom_sync_orchestrator.py"]

