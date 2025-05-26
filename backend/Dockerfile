FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Add SAT solver environment variable
ENV SAT_SOLVER_PATH=/usr/bin/z3

# Set working directory
WORKDIR /app

# Install system dependencies and Z3
RUN apt-get update && apt-get install -y --no-install-recommends \
    z3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy app source
COPY . /app/

EXPOSE 8000

CMD ["python", "movers_server/manage.py", "runserver", "0.0.0.0:8000"]
