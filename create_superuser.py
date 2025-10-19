import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print('Superusuario creado: admin/admin123')
    else:
        print('Superusuario ya existe')
except Exception as e:
    print(f'Error creando superusuario: {e}')
    # Crear usuario simple si falla
    try:
        user = User.objects.create_user('admin', 'admin@example.com', 'admin123')
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print('Superusuario creado manualmente')
    except Exception as e2:
        print(f'Error creando usuario manual: {e2}')