from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from .models import Inmueble, Movimientos_Gastos, Recibos, Detalles_Recibo, Gastos_Edificios, Pagos


def calcular_monto_por_alicuota(monto_total, alicuota):
    """Calcula el monto que corresponde a un inmueble basado en su alícuota"""
    return (monto_total * alicuota).quantize(Decimal('0.01'))


def calcular_monto_partes_iguales(monto_total, total_inmuebles):
    """Calcula el monto que corresponde a cada inmueble en partes iguales"""
    return (monto_total / total_inmuebles).quantize(Decimal('0.01'))


def generar_recibo_mensual(inmueble, mes_aplicacion, movimientos):
    """Genera un recibo mensual para un inmueble"""
    with transaction.atomic():
        # Calcular deuda anterior (recibos pendientes)
        deuda_anterior = Recibos.objects.filter(
            id_inmueble=inmueble,
            saldo_pendiente__gt=0
        ).aggregate(total=Sum('saldo_pendiente'))['total'] or Decimal('0')

        # Calcular cargos del mes
        cargos_mes = Decimal('0')
        detalles = []

        for movimiento in movimientos:
            # Verificar si el movimiento afecta al edificio del inmueble
            edificio_afectado = False
            if movimiento.id_gasto_mes.tipo_distribucion == 'Todos':
                edificio_afectado = True
            elif movimiento.id_gasto_mes.tipo_distribucion == 'Edificios_Especificos':
                edificio_afectado = Gastos_Edificios.objects.filter(
                    id_gasto_mes=movimiento.id_gasto_mes,
                    id_edificio=inmueble.edificio
                ).exists()

            if edificio_afectado:
                # Determinar tipo de cálculo según el tipo de gasto
                tipo_calculo = movimiento.id_gasto_mes.id_concepto.id_tipo_gasto.tipo_calculo
                
                if tipo_calculo == 'Comun':
                    # Gasto común: se calcula por alícuota
                    monto_calculado = calcular_monto_por_alicuota(movimiento.monto_real, inmueble.alicuota)
                else:  # No_Comun
                    # Gasto no común: se divide en partes iguales entre inmuebles afectados
                    if movimiento.id_gasto_mes.tipo_distribucion == 'Todos':
                        total_inmuebles = Inmueble.objects.count()
                    else:
                        # Contar inmuebles en edificios específicos
                        edificios_afectados = Gastos_Edificios.objects.filter(
                            id_gasto_mes=movimiento.id_gasto_mes
                        ).values_list('id_edificio', flat=True)
                        total_inmuebles = Inmueble.objects.filter(edificio__in=edificios_afectados).count()
                    
                    monto_calculado = calcular_monto_partes_iguales(movimiento.monto_real, total_inmuebles)
                
                cargos_mes += monto_calculado
                detalles.append({
                    'id_movimiento': movimiento,
                    'descripcion_gasto': movimiento.id_gasto_mes.id_concepto.descripcion,
                    'monto_calculado': monto_calculado
                })

        # Calcular intereses de mora (3% anual sobre deuda acumulada)
        interes_mora = (deuda_anterior * Decimal('0.03') / 12).quantize(Decimal('0.01'))

        # Monto total a pagar
        monto_total = deuda_anterior + cargos_mes + interes_mora

        # Crear recibo
        recibo = Recibos.objects.create(
            id_inmueble=inmueble,
            fecha_emision=timezone.now().date(),
            monto_deuda_anterior=deuda_anterior,
            monto_cargos_mes=cargos_mes,
            monto_interes_mora=interes_mora,
            monto_total_pagar=monto_total,
            saldo_pendiente=monto_total
        )

        # Crear detalles del recibo
        for detalle in detalles:
            Detalles_Recibo.objects.create(
                id_recibo=recibo,
                id_movimiento=detalle['id_movimiento'],
                descripcion_gasto=detalle['descripcion_gasto'],
                monto_calculado=detalle['monto_calculado']
            )

        return recibo


def procesar_pago(recibo, monto_pagado, referencia_bancaria):
    """Procesa un pago para un recibo"""
    with transaction.atomic():
        # Crear registro de pago
        pago = Pagos.objects.create(
            id_recibo=recibo,
            fecha_pago=timezone.now().date(),
            monto_pagado=monto_pagado,
            referencia_bancaria=referencia_bancaria,
            estado_verificacion='Por Verificar'
        )

        # Actualizar saldo pendiente del recibo
        nuevo_saldo = recibo.saldo_pendiente - monto_pagado
        recibo.saldo_pendiente = max(nuevo_saldo, Decimal('0'))
        recibo.save()

        return pago