from django.contrib import admin
from .models import (
    Propietario, Edificio, Inmueble, Tipos_Gasto, Conceptos_Gasto,
    Gastos_del_Mes, Movimientos_Gastos, Gastos_Edificios, Movimientos_Edificios,
    Recibos, Detalles_Recibo, Pagos, Tasa_Cambio, Configuracion_Recibos
)


@admin.register(Propietario)
class PropietarioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'apellido', 'cedula', 'telefono', 'email']
    search_fields = ['nombre', 'apellido', 'cedula', 'email']


@admin.register(Edificio)
class EdificioAdmin(admin.ModelAdmin):
    list_display = ['numero_edificio', 'descripcion', 'estado']
    list_filter = ['estado']
    search_fields = ['numero_edificio', 'descripcion']


@admin.register(Inmueble)
class InmuebleAdmin(admin.ModelAdmin):
    list_display = ['edificio', 'piso', 'apartamento', 'propietario', 'alicuota']
    list_filter = ['edificio']
    search_fields = ['piso', 'apartamento', 'propietario__nombre', 'propietario__apellido']


@admin.register(Tipos_Gasto)
class Tipos_GastoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion', 'tipo_calculo', 'estado']
    list_filter = ['tipo_calculo', 'estado']
    search_fields = ['nombre', 'descripcion']


@admin.register(Conceptos_Gasto)
class Conceptos_GastoAdmin(admin.ModelAdmin):
    list_display = ['descripcion', 'id_tipo_gasto']
    list_filter = ['id_tipo_gasto__estado']
    search_fields = ['descripcion']


@admin.register(Gastos_del_Mes)
class Gastos_del_MesAdmin(admin.ModelAdmin):
    list_display = ['id_concepto', 'monto_base', 'es_recurrente', 'tipo_distribucion', 'estado']
    list_filter = ['es_recurrente', 'tipo_distribucion', 'estado', 'id_concepto__id_tipo_gasto']
    search_fields = ['id_concepto__descripcion']
    actions = ['crear_movimiento']

    def crear_movimiento(self, request, queryset):
        from django.utils import timezone
        from .models import Movimientos_Gastos

        movimientos_creados = 0
        for gasto in queryset:
            # Verificar si ya existe
            existe = Movimientos_Gastos.objects.filter(
                id_gasto_mes=gasto,
                mes_aplicacion__year=timezone.now().year,
                mes_aplicacion__month=timezone.now().month
            ).exists()

            if not existe:
                Movimientos_Gastos.objects.create(
                    id_gasto_mes=gasto,
                    monto_real=gasto.monto_base,
                    fecha_gasto=timezone.now().date(),
                    mes_aplicacion=timezone.now().date().replace(day=1),
                    descripcion_adicional='Creado desde admin'
                )
                movimientos_creados += 1

        self.message_user(request, f'Se crearon {movimientos_creados} movimientos.')
    crear_movimiento.short_description = 'Crear movimientos para el mes actual'


@admin.register(Movimientos_Gastos)
class Movimientos_GastosAdmin(admin.ModelAdmin):
    list_display = ['id_gasto_mes', 'monto_real', 'fecha_gasto', 'mes_aplicacion', 'descripcion_adicional']
    list_filter = ['fecha_gasto', 'mes_aplicacion']
    search_fields = ['id_gasto_mes__id_concepto__descripcion', 'descripcion_adicional']
    date_hierarchy = 'fecha_gasto'


@admin.register(Gastos_Edificios)
class Gastos_EdificiosAdmin(admin.ModelAdmin):
    list_display = ['id_gasto_mes', 'id_edificio']
    list_filter = ['id_edificio']
    search_fields = ['id_gasto_mes__id_concepto__descripcion']


@admin.register(Movimientos_Edificios)
class Movimientos_EdificiosAdmin(admin.ModelAdmin):
    list_display = ['id_movimiento', 'id_edificio']
    list_filter = ['id_edificio']
    search_fields = ['id_movimiento__id_gasto_mes__id_concepto__descripcion']


@admin.register(Recibos)
class RecibosAdmin(admin.ModelAdmin):
    list_display = ['id_inmueble', 'fecha_emision', 'monto_total_pagar', 'saldo_pendiente']
    list_filter = ['fecha_emision']
    search_fields = ['id_inmueble__propietario__nombre', 'id_inmueble__propietario__apellido']
    date_hierarchy = 'fecha_emision'


@admin.register(Detalles_Recibo)
class Detalles_ReciboAdmin(admin.ModelAdmin):
    list_display = ['id_recibo', 'descripcion_gasto', 'monto_calculado']
    list_filter = ['id_recibo__fecha_emision']
    search_fields = ['descripcion_gasto']


@admin.register(Pagos)
class PagosAdmin(admin.ModelAdmin):
    list_display = ['id_recibo', 'fecha_pago', 'monto_pagado', 'referencia_bancaria', 'estado_verificacion']
    list_filter = ['estado_verificacion', 'fecha_pago']
    search_fields = ['referencia_bancaria', 'id_recibo__id_inmueble__propietario__nombre']
    date_hierarchy = 'fecha_pago'
    actions = ['verificar_pagos', 'rechazar_pagos']

    def verificar_pagos(self, request, queryset):
        queryset.update(estado_verificacion='Verificado')
        self.message_user(request, f'Se verificaron {queryset.count()} pagos.')
    verificar_pagos.short_description = 'Verificar pagos seleccionados'

    def rechazar_pagos(self, request, queryset):
        queryset.update(estado_verificacion='Rechazado')
        self.message_user(request, f'Se rechazaron {queryset.count()} pagos.')
    rechazar_pagos.short_description = 'Rechazar pagos seleccionados'


@admin.register(Tasa_Cambio)
class Tasa_CambioAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'tasa_bcv']
    search_fields = ['fecha']
    date_hierarchy = 'fecha'


@admin.register(Configuracion_Recibos)
class Configuracion_RecibosAdmin(admin.ModelAdmin):
    list_display = ['dia_generacion', 'hora_generacion', 'dia_recordatorio', 'hora_recordatorio', 'activo']
    list_filter = ['activo']
    
    def has_add_permission(self, request):
        # Solo permitir una configuración
        return not Configuracion_Recibos.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar la configuración
        return False