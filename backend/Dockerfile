# Use a lightweight Python image
FROM python:3.10-slim

# Install system dependencies required by z3-solver and pip packages
RUN apt-get update && apt-get install -y \
    libgmp-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory in container
WORKDIR /app

# Copy requirements first and install them (to leverage Docker cache)
COPY requirements.txt .

# Install Python dependencies including z3-solver
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Default command to run your app (adjust as needed)
CMD ["python", "main.py"]
