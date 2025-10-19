import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from condominio.models import *
from decimal import Decimal

# Actualizar gastos
gastos = Gastos_del_Mes.objects.filter(estado='Activo')
for gasto in gastos:
    if 'Nomina' in gasto.id_concepto.descripcion:
        gasto.monto_base = Decimal('500.00')
        gasto.save()
        print(f'Actualizado {gasto.id_concepto.descripcion}: ${gasto.monto_base}')
    elif 'Electricidad' in gasto.id_concepto.descripcion:
        gasto.monto_base = Decimal('200.00')
        gasto.save()
        print(f'Actualizado {gasto.id_concepto.descripcion}: ${gasto.monto_base}')

# Actualizar movimientos
movimientos = Movimientos_Gastos.objects.filter(mes_aplicacion__year=2025, mes_aplicacion__month=10)
for mov in movimientos:
    if 'Nomina' in mov.id_gasto_mes.id_concepto.descripcion:
        mov.monto_real = Decimal('500.00')
        mov.save()
    elif 'Electricidad' in mov.id_gasto_mes.id_concepto.descripcion:
        mov.monto_real = Decimal('200.00')
        mov.save()
    print(f'Movimiento: {mov.id_gasto_mes.id_concepto.descripcion} = ${mov.monto_real}')

print('\n=== VERIFICACIÓN ===')
for mov in movimientos:
    print(f'{mov.id_gasto_mes.id_concepto.descripcion}: ${mov.monto_real} ({mov.id_gasto_mes.id_concepto.id_tipo_gasto.tipo_calculo})')