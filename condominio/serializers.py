from rest_framework import serializers
from .models import (
    Propietario, Edificio, Inmueble, Tipos_Gasto, Conceptos_Gasto,
    Gastos_del_Mes, Movimientos_Gastos, Gastos_Edificios, Movimientos_Edificios,
    Recibos, Detalles_Recibo, Pagos, Tasa_Cambio, Configuracion_Recibos,
    Historial_Pagos, Creditos_Propietario
)


class PropietarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Propietario
        fields = '__all__'


class EdificioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edificio
        fields = '__all__'


class InmuebleSerializer(serializers.ModelSerializer):
    propietario = PropietarioSerializer(read_only=True)
    edificio = EdificioSerializer(read_only=True)

    class Meta:
        model = Inmueble
        fields = '__all__'


class InmuebleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inmueble
        fields = '__all__'


class Tipos_GastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tipos_Gasto
        fields = '__all__'


class Conceptos_GastoSerializer(serializers.ModelSerializer):
    id_tipo_gasto = Tipos_GastoSerializer(read_only=True)

    class Meta:
        model = Conceptos_Gasto
        fields = '__all__'


class Conceptos_GastoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conceptos_Gasto
        fields = '__all__'


class Gastos_del_MesSerializer(serializers.ModelSerializer):
    id_concepto = Conceptos_GastoSerializer(read_only=True)
    edificios_seleccionados = serializers.SerializerMethodField()
    
    class Meta:
        model = Gastos_del_Mes
        fields = '__all__'
        
    def get_edificios_seleccionados(self, obj):
        if obj.tipo_distribucion == 'Edificios_Especificos':
            from .models import Gastos_Edificios
            gastos_edificios = Gastos_Edificios.objects.filter(id_gasto_mes=obj).select_related('id_edificio')
            return [{
                'id': ge.id_edificio.id,
                'numero_edificio': ge.id_edificio.numero_edificio,
                'descripcion': ge.id_edificio.descripcion
            } for ge in gastos_edificios]
        return []


class Gastos_del_MesCreateSerializer(serializers.ModelSerializer):
    edificios_seleccionados = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Gastos_del_Mes
        fields = '__all__'
        
    def create(self, validated_data):
        edificios_seleccionados = validated_data.pop('edificios_seleccionados', [])
        gasto_mes = super().create(validated_data)
        
        # Si hay edificios seleccionados, crear las relaciones
        if edificios_seleccionados:
            from .models import Gastos_Edificios, Edificio
            for edificio_id in edificios_seleccionados:
                try:
                    edificio = Edificio.objects.get(id=edificio_id)
                    Gastos_Edificios.objects.create(
                        id_gasto_mes=gasto_mes,
                        id_edificio=edificio
                    )
                except Edificio.DoesNotExist:
                    continue
                    
        return gasto_mes


class Movimientos_GastosSerializer(serializers.ModelSerializer):
    id_gasto_mes = Gastos_del_MesSerializer(read_only=True)

    class Meta:
        model = Movimientos_Gastos
        fields = '__all__'


class Movimientos_GastosCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movimientos_Gastos
        fields = '__all__'


class Gastos_EdificiosSerializer(serializers.ModelSerializer):
    id_gasto_mes = Gastos_del_MesSerializer(read_only=True)
    id_edificio = EdificioSerializer(read_only=True)

    class Meta:
        model = Gastos_Edificios
        fields = '__all__'


class Movimientos_EdificiosSerializer(serializers.ModelSerializer):
    id_movimiento = Movimientos_GastosSerializer(read_only=True)
    id_edificio = EdificioSerializer(read_only=True)

    class Meta:
        model = Movimientos_Edificios
        fields = '__all__'


class RecibosSerializer(serializers.ModelSerializer):
    id_inmueble = InmuebleSerializer(read_only=True)
    detalles = serializers.SerializerMethodField()
    es_moroso = serializers.SerializerMethodField()
    recibos_sin_pagar = serializers.SerializerMethodField()
    
    class Meta:
        model = Recibos
        fields = '__all__'
    
    def get_detalles(self, obj):
        from .models import Detalles_Recibo
        detalles = Detalles_Recibo.objects.filter(id_recibo=obj).order_by('tipo_gasto', 'descripcion_gasto')
        return [{
            'id': detalle.id,
            'descripcion_gasto': detalle.descripcion_gasto,
            'tipo_gasto': detalle.tipo_gasto,
            'monto_calculado': str(detalle.monto_calculado)
        } for detalle in detalles]
    
    def get_es_moroso(self, obj):
        return obj.es_moroso
    
    def get_recibos_sin_pagar(self, obj):
        return obj.recibos_sin_pagar_inmueble


class Detalles_ReciboSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detalles_Recibo
        fields = '__all__'


class PagosSerializer(serializers.ModelSerializer):
    id_recibo = RecibosSerializer(read_only=True)
    propietario = serializers.SerializerMethodField()
    inmueble = serializers.SerializerMethodField()
    monto_adeudado = serializers.SerializerMethodField()
    discrepancia = serializers.SerializerMethodField()
    
    class Meta:
        model = Pagos
        fields = '__all__'
    
    def get_propietario(self, obj):
        return f"{obj.id_recibo.id_inmueble.propietario.nombre} {obj.id_recibo.id_inmueble.propietario.apellido}"
    
    def get_inmueble(self, obj):
        inmueble = obj.id_recibo.id_inmueble
        return f"{inmueble.edificio.numero_edificio}-{inmueble.piso}{inmueble.apartamento}"
    
    def get_monto_adeudado(self, obj):
        return obj.id_recibo.monto_total_pagar
    
    def get_discrepancia(self, obj):
        return obj.monto_pagado != obj.id_recibo.monto_total_pagar


class Tasa_CambioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tasa_Cambio
        fields = '__all__'


class Configuracion_RecibosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracion_Recibos
        fields = '__all__'


class Historial_PagosSerializer(serializers.ModelSerializer):
    propietario = PropietarioSerializer(read_only=True)
    id_recibo = RecibosSerializer(read_only=True)
    
    class Meta:
        model = Historial_Pagos
        fields = '__all__'


class Creditos_PropietarioSerializer(serializers.ModelSerializer):
    propietario = PropietarioSerializer(read_only=True)
    
    class Meta:
        model = Creditos_Propietario
        fields = '__all__'