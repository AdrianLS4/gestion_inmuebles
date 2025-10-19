import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import connection

print("=== VERIFICACIÓN DE BASE DE DATOS ===")

# Verificar conexión
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    print("✅ Conexión a base de datos OK")
except Exception as e:
    print(f"❌ Error de conexión: {e}")

# Verificar tablas
try:
    tables = connection.introspection.table_names()
    print(f"✅ Tablas encontradas: {len(tables)}")
    if 'auth_user' in tables:
        print("✅ Tabla auth_user existe")
    else:
        print("❌ Tabla auth_user NO existe")
except Exception as e:
    print(f"❌ Error verificando tablas: {e}")

# Verificar usuarios
try:
    users = User.objects.all()
    print(f"✅ Usuarios en DB: {users.count()}")
    for user in users:
        print(f"  - {user.username} (staff: {user.is_staff}, super: {user.is_superuser})")
except Exception as e:
    print(f"❌ Error verificando usuarios: {e}")

print("=== FIN VERIFICACIÓN ===")