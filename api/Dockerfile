# Use Debian-based Python image (compatible with shapely/fiona)
FROM python:3.11-slim-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    gdal-bin \
    libgdal-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL environment variable for fiona
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal
ENV GDAL_VERSION=3.3.2

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your source code
COPY . .

# Expose the port Cloud Run will connect to
EXPOSE 8080

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
