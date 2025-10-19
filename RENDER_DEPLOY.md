# Despliegue en Render

## Pasos para Desplegar:

### 1. Preparar Repositorio
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

### 2. En Render Dashboard:
1. **New** → **Web Service**
2. Conectar tu repositorio GitHub
3. Configurar:
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn core.wsgi:application`
   - **Environment**: Python 3

### 3. Variables de Entorno:
```
DEBUG=False
SECRET_KEY=[Auto-generated]
DATABASE_URL=[From PostgreSQL service]
ALLOWED_HOSTS=your-app.onrender.com
PYTHON_VERSION=3.11.0
```

### 4. Base de Datos PostgreSQL:
1. **New** → **PostgreSQL**
2. Copiar `DATABASE_URL` a las variables del Web Service

### 5. Configuración Automática:
- Usar `render.yaml` para deploy automático
- Conectar repo y Render detectará la configuración

## URLs Finales:
- **App**: https://your-app.onrender.com
- **Admin**: https://your-app.onrender.com/admin
- **API**: https://your-app.onrender.com/api