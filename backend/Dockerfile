FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed (e.g., for psycopg2 if used, though usually binary wheels work)
RUN apt-get update && apt-get install -y make && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
