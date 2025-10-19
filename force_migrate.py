import os
import django
from django.core.management import execute_from_command_line

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

print("=== FORZANDO MIGRACIONES ===")

try:
    # Ejecutar migraciones
    execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
    print("✅ Migraciones ejecutadas con --run-syncdb")
except Exception as e:
    print(f"❌ Error con --run-syncdb: {e}")
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Migraciones ejecutadas normalmente")
    except Exception as e2:
        print(f"❌ Error con migrate normal: {e2}")

print("=== FIN MIGRACIONES ===")