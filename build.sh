#!/usr/bin/env bash
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Check database
python check_db.py

# Create superuser
python create_superuser.py

# Check database again
python check_db.py

# Collect static files
python manage.py collectstatic --noinput --clear