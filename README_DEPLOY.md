# Guía de Despliegue - Sistema de Gestión de Inmuebles

## Opciones de Despliegue

### 1. Despliegue Local Rápido

```bash
# 1. Clonar y navegar al proyecto
cd core

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Ejecutar script de despliegue
chmod +x deploy.sh
./deploy.sh

# 4. Iniciar servidor
python manage.py runserver
```

### 2. Despliegue con Docker

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# La aplicación estará disponible en http://localhost:8000
```

### 3. Despliegue en Producción

#### Heroku
```bash
# 1. Instalar Heroku CLI
# 2. Crear aplicación
heroku create tu-app-condominio

# 3. Configurar variables de entorno
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=tu-clave-secreta-aqui
heroku config:set ALLOWED_HOSTS=tu-app-condominio.herokuapp.com

# 4. Agregar PostgreSQL
heroku addons:create heroku-postgresql:mini

# 5. Desplegar
git push heroku main
heroku run python manage.py migrate
```

#### Railway/Render
1. Conectar repositorio
2. Configurar variables de entorno desde `.env.example`
3. El build se ejecutará automáticamente

## Configuración Inicial

### Base de Datos
- **Local**: SQLite (por defecto)
- **Producción**: PostgreSQL (recomendado)

### Usuario Administrador
- **Usuario**: admin
- **Contraseña**: admin123
- **Panel**: http://localhost:8000/admin/

### API Endpoints
- **Base URL**: http://localhost:8000/api/
- **Documentación**: http://localhost:8000/swagger/

## Variables de Entorno Importantes

```env
DEBUG=False                    # Producción
SECRET_KEY=clave-super-secreta
DATABASE_URL=postgresql://...  # URL completa de BD
ALLOWED_HOSTS=tu-dominio.com
```

## Estructura del Proyecto

```
core/
├── condominio/           # App principal Django
├── condominio-frontend/  # Frontend React/Vite
├── core/                # Configuración Django
├── requirements.txt     # Dependencias Python
├── Dockerfile          # Contenedor Docker
├── docker-compose.yml  # Orquestación local
└── deploy.sh          # Script de despliegue
```

## Solución de Problemas

### Error de CORS
Agregar tu dominio a `CORS_ALLOWED_ORIGINS` en settings.py

### Error de Base de Datos
Verificar `DATABASE_URL` y ejecutar migraciones:
```bash
python manage.py migrate
```

### Archivos Estáticos
```bash
python manage.py collectstatic --noinput
```