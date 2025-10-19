#!/usr/bin/env bash
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Force migrations
python force_migrate.py

# Check database
python check_db.py

# Create superuser
python create_superuser.py

# Final check
python check_db.py

# Collect static files
python manage.py collectstatic --noinput --clear