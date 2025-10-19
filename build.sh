#!/usr/bin/env bash
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Collect static files (this will collect Django admin and DRF static files)
python manage.py collectstatic --noinput --clear

# Run migrations
python manage.py migrate

# Create superuser
python create_superuser.py