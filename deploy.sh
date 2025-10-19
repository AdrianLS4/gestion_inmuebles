#!/bin/bash

echo "🚀 Iniciando despliegue de la aplicación..."

# Construir frontend
echo "📦 Construyendo frontend..."
cd condominio-frontend
npm install
npm run build
cd ..

# Instalar dependencias de Python
echo "🐍 Instalando dependencias de Python..."
pip install -r requirements.txt

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones..."
python manage.py migrate

# Recopilar archivos estáticos
echo "📁 Recopilando archivos estáticos..."
python manage.py collectstatic --noinput

# Crear superusuario si no existe
echo "👤 Configurando usuario administrador..."
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superusuario creado: admin/admin123')
else:
    print('Superusuario ya existe')
"

echo "✅ Despliegue completado!"
echo "🌐 Inicia el servidor con: python manage.py runserver"