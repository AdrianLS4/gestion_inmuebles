FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY condominio-frontend/package*.json ./
RUN npm ci
COPY condominio-frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=frontend-build /app/frontend/dist ./condominio-frontend/dist
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]