#!/bin/sh
set -e

# Initialize database tables
echo "Initializing database tables..."
make create-database-tables

# # Populate database
# echo "Populating database..."
# make populate-database

# Start the application
echo "Starting FastAPI server..."
exec fastapi run app/main.py --port 8000 --host 0.0.0.0
