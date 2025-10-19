#!/usr/bin/env bash
set -o errexit

# Build frontend
cd condominio-frontend
npm ci
npm run build
cd ..

# Install Python dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate