from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models.functions import TruncMonth
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime, timezone, timedelta
from .models import (
    Propietario, Edificio, Inmueble, Pagos, Recibos,
    Tipos_Gasto, Conceptos_Gasto, Gastos_del_Mes, Movimientos_Gastos, Tasa_Cambio, Configuracion_Recibos,
    Historial_Pagos, Creditos_Propietario
)
from .serializers import (
    PropietarioSerializer, EdificioSerializer, InmuebleSerializer, InmuebleCreateSerializer, PagosSerializer, RecibosSerializer,
    Tipos_GastoSerializer, Conceptos_GastoSerializer, Conceptos_GastoCreateSerializer, 
    Gastos_del_MesSerializer, Gastos_del_MesCreateSerializer,
    Movimientos_GastosSerializer, Movimientos_GastosCreateSerializer,
    Tasa_CambioSerializer, Configuracion_RecibosSerializer
)
from .services import procesar_pago


class PropietarioViewSet(viewsets.ModelViewSet):
    queryset = Propietario.objects.all().order_by('id')
    serializer_class = PropietarioSerializer
    permission_classes = [AllowAny]


class EdificioViewSet(viewsets.ModelViewSet):
    queryset = Edificio.objects.all().order_by('id')
    serializer_class = EdificioSerializer
    permission_classes = [AllowAny]


class InmuebleViewSet(viewsets.ModelViewSet):
    queryset = Inmueble.objects.all().order_by('id')
    serializer_class = InmuebleSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InmuebleCreateSerializer
        return InmuebleSerializer


class RecibosViewSet(viewsets.ModelViewSet):
    queryset = Recibos.objects.all().order_by('-fecha_emision', 'numero_recibo')
    serializer_class = RecibosSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        mes = self.request.query_params.get('mes')
        numero_recibo = self.request.query_params.get('numero_recibo')
        propietario = self.request.query_params.get('propietario')
        inmueble = self.request.query_params.get('inmueble')
        saldo_pendiente_gt = self.request.query_params.get('saldo_pendiente__gt')
        
        if mes:
            queryset = queryset.filter(fecha_emision__startswith=mes)
        if numero_recibo:
            queryset = queryset.filter(numero_recibo__icontains=numero_recibo)
        if propietario:
            queryset = queryset.filter(id_inmueble__propietario_id=propietario)
        if inmueble:
            queryset = queryset.filter(id_inmueble_id=inmueble)
        if saldo_pendiente_gt:
            queryset = queryset.filter(saldo_pendiente__gt=saldo_pendiente_gt)
            
        return queryset

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generar PDF del recibo"""
        from .pdf_service import crear_respuesta_pdf
        recibo = self.get_object()
        return crear_respuesta_pdf(recibo)
    
    @action(detail=True, methods=['post'])
    def registrar_pago(self, request, pk=None):
        from decimal import Decimal
        from datetime import date
        from django.db import transaction
        from .models import Historial_Pagos, Creditos_Propietario
        
        recibo = self.get_object()
        monto_pagado = request.data.get('monto_pagado')
        referencia_bancaria = request.data.get('referencia_bancaria')

        if not monto_pagado or not referencia_bancaria:
            return Response({'error': 'monto_pagado y referencia_bancaria son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            monto_pagado = Decimal(str(monto_pagado))
            propietario = recibo.id_inmueble.propietario
            
            with transaction.atomic():
                # Verificar si ya existe un pago verificado con esta referencia
                if Pagos.objects.filter(referencia_bancaria=referencia_bancaria, estado_verificacion='Verificado').exists():
                    return Response({'error': 'Ya existe un pago verificado con esta referencia bancaria'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Obtener o crear crédito del propietario
                credito, created = Creditos_Propietario.objects.get_or_create(
                    propietario=propietario,
                    defaults={'saldo_credito': Decimal('0')}
                )
                
                # Aplicar crédito existente primero si hay
                monto_disponible = monto_pagado + credito.saldo_credito
                credito.saldo_credito = Decimal('0')
                
                # Obtener todos los recibos pendientes del propietario ordenados por fecha
                recibos_pendientes = Recibos.objects.filter(
                    id_inmueble__propietario=propietario,
                    saldo_pendiente__gt=0
                ).order_by('fecha_emision')
                
                pagos_aplicados = []
                monto_restante = monto_disponible
                
                # Aplicar pagos a recibos pendientes
                for recibo_pendiente in recibos_pendientes:
                    if monto_restante <= 0:
                        break
                    
                    monto_a_aplicar = min(monto_restante, recibo_pendiente.saldo_pendiente)
                    
                    # Actualizar saldo del recibo
                    recibo_pendiente.saldo_pendiente -= monto_a_aplicar
                    if recibo_pendiente.saldo_pendiente == 0:
                        recibo_pendiente.estado = 'Pagado'
                    recibo_pendiente.save()
                    
                    # Determinar tipo de transacción
                    if monto_a_aplicar == recibo_pendiente.saldo_pendiente + monto_a_aplicar:
                        tipo_transaccion = 'Pago_Completo'
                    else:
                        tipo_transaccion = 'Pago_Parcial'
                    
                    # Crear historial
                    Historial_Pagos.objects.create(
                        id_recibo=recibo_pendiente,
                        propietario=propietario,
                        monto_aplicado=monto_a_aplicar,
                        tipo_transaccion=tipo_transaccion,
                        referencia_bancaria=referencia_bancaria,
                        notas=f'Aplicado desde pago de recibo {recibo.numero_recibo}'
                    )
                    
                    pagos_aplicados.append({
                        'recibo': recibo_pendiente.numero_recibo,
                        'monto_aplicado': monto_a_aplicar,
                        'saldo_restante': recibo_pendiente.saldo_pendiente
                    })
                    
                    monto_restante -= monto_a_aplicar
                
                # Si queda dinero, guardarlo como crédito
                if monto_restante > 0:
                    credito.saldo_credito = monto_restante
                    
                    # Crear historial de sobrepago
                    Historial_Pagos.objects.create(
                        id_recibo=recibo,
                        propietario=propietario,
                        monto_aplicado=monto_pagado,
                        monto_credito_generado=monto_restante,
                        tipo_transaccion='Sobrepago',
                        referencia_bancaria=referencia_bancaria,
                        notas=f'Sobrepago generó crédito de ${monto_restante}'
                    )
                
                credito.save()
                
                # Crear el registro de pago principal
                pago = Pagos.objects.create(
                    id_recibo=recibo,
                    fecha_pago=date.today(),
                    monto_pagado=monto_pagado,
                    referencia_bancaria=referencia_bancaria,
                    metodo_pago='Transferencia',
                    estado_verificacion='Verificado'
                )
                
                return Response({
                    'message': 'Pago registrado exitosamente',
                    'pago_id': pago.id,
                    'monto_pagado': monto_pagado,
                    'pagos_aplicados': pagos_aplicados,
                    'credito_restante': credito.saldo_credito,
                    'total_aplicado': monto_disponible - monto_restante
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def generar_recibos(self, request):
        from decimal import Decimal
        from .models import Detalles_Recibo, Gastos_Edificios
        from datetime import datetime, timedelta
        
        mes_aplicacion = request.data.get('mes_aplicacion')
        
        if not mes_aplicacion:
            return Response({'error': 'mes_aplicacion es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate date format
        try:
            datetime.strptime(mes_aplicacion, '%Y-%m-%d')
        except ValueError as e:
            return Response({'error': f'mes_aplicacion debe tener formato YYYY-MM-DD. Recibido: {mes_aplicacion}'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Convert string date to datetime object
            from datetime import datetime
            fecha_emision_obj = datetime.strptime(mes_aplicacion, '%Y-%m-%d').date()
            
            inmuebles = Inmueble.objects.all().select_related('propietario', 'edificio')
            recibos_generados = 0
            
            for inmueble in inmuebles:
                if Recibos.objects.filter(id_inmueble=inmueble, fecha_emision__startswith=mes_aplicacion[:7]).exists():
                    continue
                
                # Gastos fijos mensuales (conceptos activos)
                gastos_mes = Gastos_del_Mes.objects.filter(estado='Activo').select_related('id_concepto__id_tipo_gasto')
                
                monto_cargos_mes = Decimal('0')
                detalles = []
                
                for gasto in gastos_mes:
                    tipo_gasto = gasto.id_concepto.id_tipo_gasto
                    monto_calculado = Decimal('0')
                    
                    if tipo_gasto.tipo_calculo == 'Comun':
                        monto_calculado = gasto.monto_base * inmueble.alicuota
                        if monto_calculado > 0:
                            detalles.append({
                                'descripcion': gasto.id_concepto.descripcion,
                                'monto': monto_calculado,
                                'tipo': 'Comun'
                            })
                    else:
                        gastos_edificios = Gastos_Edificios.objects.filter(
                            id_gasto_mes=gasto,
                            id_edificio=inmueble.edificio
                        )
                        
                        if gastos_edificios.exists():
                            edificios_ids = Gastos_Edificios.objects.filter(
                                id_gasto_mes=gasto
                            ).values_list('id_edificio', flat=True)
                            
                            total_apartamentos = Inmueble.objects.filter(
                                edificio_id__in=edificios_ids
                            ).count()
                            
                            if total_apartamentos > 0:
                                monto_calculado = gasto.monto_base / total_apartamentos
                                detalles.append({
                                    'descripcion': gasto.id_concepto.descripcion,
                                    'monto': monto_calculado,
                                    'tipo': 'No_Comun'
                                })
                    
                    monto_cargos_mes += monto_calculado
                
                if monto_cargos_mes > 0:
                    recibo = Recibos.objects.create(
                        id_inmueble=inmueble,
                        fecha_emision=fecha_emision_obj,
                        monto_deuda_anterior=Decimal('0'),
                        monto_cargos_mes=monto_cargos_mes,
                        monto_interes_mora=Decimal('0'),
                        monto_total_pagar=monto_cargos_mes,
                        saldo_pendiente=monto_cargos_mes
                    )
                    
                    for detalle in detalles:
                        Detalles_Recibo.objects.create(
                            id_recibo=recibo,
                            id_movimiento=None,
                            descripcion_gasto=detalle['descripcion'],
                            tipo_gasto=detalle['tipo'],
                            monto_calculado=detalle['monto']
                        )
                    
                    recibos_generados += 1
            
            return Response({
                'message': f'Se generaron {recibos_generados} recibos exitosamente',
                'recibos_generados': recibos_generados
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def actualizar_estados(self, request):
        """Actualizar estados de recibos basado en saldo_pendiente"""
        try:
            # Actualizar recibos pagados
            recibos_pagados = Recibos.objects.filter(saldo_pendiente=0, estado='Pendiente')
            count_pagados = recibos_pagados.update(estado='Pagado')
            
            # Actualizar recibos pendientes
            recibos_pendientes = Recibos.objects.filter(saldo_pendiente__gt=0, estado='Pagado')
            count_pendientes = recibos_pendientes.update(estado='Pendiente')
            
            return Response({
                'message': f'Estados actualizados: {count_pagados} marcados como pagados, {count_pendientes} marcados como pendientes',
                'recibos_pagados': count_pagados,
                'recibos_pendientes': count_pendientes
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def actualizar_recibos(self, request):
        from decimal import Decimal
        from .models import Detalles_Recibo, Gastos_Edificios
        
        mes_aplicacion = request.data.get('mes_aplicacion')
        print(f"DEBUG: mes_aplicacion = {mes_aplicacion}")
        print(f"DEBUG: request.data = {request.data}")
        
        if not mes_aplicacion:
            print("DEBUG: mes_aplicacion is missing")
            return Response({'error': 'mes_aplicacion es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Convert string date to datetime object
            from datetime import datetime
            fecha_emision_obj = datetime.strptime(mes_aplicacion, '%Y-%m-%d').date()
            
            # Eliminar recibos existentes del mes
            recibos_existentes = Recibos.objects.filter(fecha_emision__startswith=mes_aplicacion[:7])
            count_eliminados = recibos_existentes.count()
            print(f"DEBUG: Eliminando {count_eliminados} recibos del mes {mes_aplicacion[:7]}")
            
            # Debug: mostrar qué recibos se van a eliminar
            for recibo in recibos_existentes:
                propietario_nombre = f"{recibo.id_inmueble.propietario.nombre} {recibo.id_inmueble.propietario.apellido}"
                print(f"DEBUG: Eliminando recibo {recibo.id} - {propietario_nombre} - Monto: {recibo.monto_total_pagar}")
            
            recibos_existentes.delete()
            
            # Generar nuevos recibos
            inmuebles = Inmueble.objects.all().select_related('propietario', 'edificio')
            recibos_generados = 0
            
            for inmueble in inmuebles:
                print(f"DEBUG: Procesando inmueble {inmueble.id} - Alícuota: {inmueble.alicuota}")
                gastos_mes = Gastos_del_Mes.objects.filter(estado='Activo').select_related('id_concepto__id_tipo_gasto')
                
                monto_cargos_mes = Decimal('0')
                detalles = []
                
                for gasto in gastos_mes:
                    tipo_gasto = gasto.id_concepto.id_tipo_gasto
                    monto_calculado = Decimal('0')
                    
                    if tipo_gasto.tipo_calculo == 'Comun':
                        monto_calculado = gasto.monto_base * inmueble.alicuota
                        print(f"DEBUG: Gasto común {gasto.id_concepto.descripcion}: {gasto.monto_base} * {inmueble.alicuota} = {monto_calculado}")
                        if monto_calculado > 0:
                            detalles.append({
                                'descripcion': gasto.id_concepto.descripcion,
                                'monto': monto_calculado,
                                'tipo': 'Comun'
                            })
                    else:
                        gastos_edificios = Gastos_Edificios.objects.filter(
                            id_gasto_mes=gasto,
                            id_edificio=inmueble.edificio
                        )
                        
                        if gastos_edificios.exists():
                            edificios_ids = Gastos_Edificios.objects.filter(
                                id_gasto_mes=gasto
                            ).values_list('id_edificio', flat=True)
                            
                            total_apartamentos = Inmueble.objects.filter(
                                edificio_id__in=edificios_ids
                            ).count()
                            
                            if total_apartamentos > 0:
                                monto_calculado = gasto.monto_base / total_apartamentos
                                detalles.append({
                                    'descripcion': gasto.id_concepto.descripcion,
                                    'monto': monto_calculado,
                                    'tipo': 'No_Comun'
                                })
                    
                    monto_cargos_mes += monto_calculado
                
                if monto_cargos_mes > 0:
                    recibo = Recibos.objects.create(
                        id_inmueble=inmueble,
                        fecha_emision=fecha_emision_obj,
                        monto_deuda_anterior=Decimal('0'),
                        monto_cargos_mes=monto_cargos_mes,
                        monto_interes_mora=Decimal('0'),
                        monto_total_pagar=monto_cargos_mes,
                        saldo_pendiente=monto_cargos_mes
                    )
                    
                    for detalle in detalles:
                        Detalles_Recibo.objects.create(
                            id_recibo=recibo,
                            id_movimiento=None,
                            descripcion_gasto=detalle['descripcion'],
                            tipo_gasto=detalle['tipo'],
                            monto_calculado=detalle['monto']
                        )
                    
                    propietario_nombre = f"{inmueble.propietario.nombre} {inmueble.propietario.apellido}"
                    print(f"DEBUG: Creando recibo {recibo.id} - {propietario_nombre} - Monto: {monto_cargos_mes}")
                    recibos_generados += 1
            
            return Response({
                'message': f'Actualizados: eliminados {count_eliminados}, generados {recibos_generados} recibos',
                'recibos_eliminados': count_eliminados,
                'recibos_generados': recibos_generados
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PagosViewSet(viewsets.ModelViewSet):
    queryset = Pagos.objects.all().order_by('id')
    serializer_class = PagosSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado')
        fecha = self.request.query_params.get('fecha')
        
        if estado:
            queryset = queryset.filter(estado_verificacion=estado)
        if fecha:
            queryset = queryset.filter(fecha_pago=fecha)
            
        return queryset.select_related('id_recibo__id_inmueble__propietario', 'id_recibo__id_inmueble__edificio')
    
    @action(detail=True, methods=['post'])
    def verificar(self, request, pk=None):
        from decimal import Decimal
        
        pago = self.get_object()
        fecha_pago = request.data.get('fecha_pago')
        monto_pagado = request.data.get('monto_pagado')
        notas = request.data.get('notas', '')
        comprobante = request.FILES.get('comprobante')
        
        try:
            if fecha_pago:
                pago.fecha_pago = fecha_pago
            if monto_pagado:
                pago.monto_pagado = Decimal(str(monto_pagado))
            
            pago.estado_verificacion = 'Verificado'
            pago.nota = notas
            pago.save()
            
            # Actualizar saldo del recibo
            recibo = pago.id_recibo
            nuevo_saldo = recibo.saldo_pendiente - pago.monto_pagado
            recibo.saldo_pendiente = max(Decimal('0'), nuevo_saldo)
            if recibo.saldo_pendiente == 0:
                recibo.estado = 'Pagado'
            recibo.save()
            
            return Response({'message': 'Pago verificado exitosamente'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        pago = self.get_object()
        notas = request.data.get('notas', '')
        
        try:
            pago.estado_verificacion = 'Rechazado'
            pago.nota = notas
            pago.save()
            
            return Response({'message': 'Pago rechazado exitosamente'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verificar_multiples(self, request):
        ids = request.data.get('ids', [])
        
        if not ids:
            return Response({'error': 'IDs son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pagos = Pagos.objects.filter(id__in=ids)
            pagos.update(estado_verificacion='Verificado')
            
            return Response({'message': f'{len(ids)} pagos verificados exitosamente'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class Tipos_GastoViewSet(viewsets.ModelViewSet):
    queryset = Tipos_Gasto.objects.all().order_by('id')
    serializer_class = Tipos_GastoSerializer
    permission_classes = [AllowAny]


class Conceptos_GastoViewSet(viewsets.ModelViewSet):
    queryset = Conceptos_Gasto.objects.all().order_by('id')
    serializer_class = Conceptos_GastoSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return Conceptos_GastoCreateSerializer
        return Conceptos_GastoSerializer


class Gastos_del_MesViewSet(viewsets.ModelViewSet):
    queryset = Gastos_del_Mes.objects.all().order_by('id')
    serializer_class = Gastos_del_MesSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return Gastos_del_MesCreateSerializer
        return Gastos_del_MesSerializer
    
    @action(detail=True, methods=['post'])
    def agregar_edificio(self, request, pk=None):
        from .models import Gastos_Edificios, Edificio
        gasto = self.get_object()
        edificio_id = request.data.get('edificio_id')
        
        try:
            edificio = Edificio.objects.get(id=edificio_id)
            Gastos_Edificios.objects.get_or_create(
                id_gasto_mes=gasto,
                id_edificio=edificio
            )
            return Response({'message': 'Edificio agregado exitosamente'})
        except Edificio.DoesNotExist:
            return Response({'error': 'Edificio no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def eliminar_edificio(self, request, pk=None):
        from .models import Gastos_Edificios
        gasto = self.get_object()
        edificio_id = request.data.get('edificio_id')
        
        try:
            gasto_edificio = Gastos_Edificios.objects.get(
                id_gasto_mes=gasto,
                id_edificio_id=edificio_id
            )
            gasto_edificio.delete()
            return Response({'message': 'Edificio eliminado exitosamente'})
        except Gastos_Edificios.DoesNotExist:
            return Response({'error': 'Relación no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class Movimientos_GastosViewSet(viewsets.ModelViewSet):
    queryset = Movimientos_Gastos.objects.all().order_by('id')
    serializer_class = Movimientos_GastosSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return Movimientos_GastosCreateSerializer
        return Movimientos_GastosSerializer


class Tasa_CambioViewSet(viewsets.ModelViewSet):
    queryset = Tasa_Cambio.objects.all().order_by('id')
    serializer_class = Tasa_CambioSerializer


class Configuracion_RecibosViewSet(viewsets.ModelViewSet):
    queryset = Configuracion_Recibos.objects.all().order_by('id')
    serializer_class = Configuracion_RecibosSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def generar_automatico(self, request):
        """Endpoint para generar recibos automáticamente según configuración"""
        from datetime import date
        from decimal import Decimal
        from .models import Movimientos_Gastos, Detalles_Recibo, Gastos_Edificios
        
        try:
            config = Configuracion_Recibos.objects.filter(activo=True).first()
            if not config:
                return Response({'error': 'No hay configuración activa'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generar para el mes actual
            fecha_actual = date.today()
            mes_aplicacion = fecha_actual.strftime('%Y-%m-01')
            
            inmuebles = Inmueble.objects.all().select_related('propietario', 'edificio')
            recibos_generados = 0
            
            for inmueble in inmuebles:
                if Recibos.objects.filter(id_inmueble=inmueble, fecha_emision__startswith=mes_aplicacion[:7]).exists():
                    continue
                
                gastos_mes = Gastos_del_Mes.objects.filter(estado='Activo').select_related('id_concepto__id_tipo_gasto')
                
                monto_cargos_mes = Decimal('0')
                detalles = []
                
                for gasto in gastos_mes:
                    tipo_gasto = gasto.id_concepto.id_tipo_gasto
                    monto_calculado = Decimal('0')
                    
                    if tipo_gasto.tipo_calculo == 'Comun':
                        monto_calculado = gasto.monto_base * inmueble.alicuota
                        if monto_calculado > 0:
                            detalles.append({
                                'descripcion': gasto.id_concepto.descripcion,
                                'monto': monto_calculado,
                                'tipo': 'Comun'
                            })
                    else:
                        gastos_edificios = Gastos_Edificios.objects.filter(
                            id_gasto_mes=gasto,
                            id_edificio=inmueble.edificio
                        )
                        
                        if gastos_edificios.exists():
                            edificios_ids = Gastos_Edificios.objects.filter(
                                id_gasto_mes=gasto
                            ).values_list('id_edificio', flat=True)
                            
                            total_apartamentos = Inmueble.objects.filter(
                                edificio_id__in=edificios_ids
                            ).count()
                            
                            if total_apartamentos > 0:
                                monto_calculado = gasto.monto_base / total_apartamentos
                                detalles.append({
                                    'descripcion': gasto.id_concepto.descripcion,
                                    'monto': monto_calculado,
                                    'tipo': 'No_Comun'
                                })
                    
                    monto_cargos_mes += monto_calculado
                
                if monto_cargos_mes > 0:
                    recibo = Recibos.objects.create(
                        id_inmueble=inmueble,
                        fecha_emision=fecha_actual,
                        monto_deuda_anterior=Decimal('0'),
                        monto_cargos_mes=monto_cargos_mes,
                        monto_interes_mora=Decimal('0'),
                        monto_total_pagar=monto_cargos_mes,
                        saldo_pendiente=monto_cargos_mes
                    )
                    
                    for detalle in detalles:
                        Detalles_Recibo.objects.create(
                            id_recibo=recibo,
                            id_movimiento=None,
                            descripcion_gasto=detalle['descripcion'],
                            tipo_gasto=detalle['tipo'],
                            monto_calculado=detalle['monto']
                        )
                    
                    recibos_generados += 1
            
            return Response({
                'message': f'Generación automática completada: {recibos_generados} recibos',
                'recibos_generados': recibos_generados,
                'fecha_generacion': fecha_actual
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def enviar_recordatorios(self, request):
        """Endpoint para enviar recordatorios WhatsApp"""
        from django.core.management import call_command
        from io import StringIO
        import sys
        
        try:
            # Capturar la salida del comando
            old_stdout = sys.stdout
            sys.stdout = buffer = StringIO()
            
            # Ejecutar comando de recordatorios
            call_command('enviar_recordatorios')
            
            # Restaurar stdout
            sys.stdout = old_stdout
            output = buffer.getvalue()
            
            # Extraer número de recordatorios enviados del output
            lines = output.strip().split('\n')
            last_line = lines[-1] if lines else ''
            
            enviados = 0
            if 'recordatorios enviados' in last_line:
                try:
                    enviados = int(last_line.split(':')[1].split('recordatorios')[0].strip())
                except:
                    pass
            
            return Response({
                'message': 'Recordatorios enviados exitosamente',
                'enviados': enviados,
                'output': output
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReportesViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def morosos(self, request):
        from django.db.models import Sum, Count
        from .models import Recibos

        # Agrupar por inmueble y sumar deudas
        morosos_query = Recibos.objects.filter(saldo_pendiente__gt=0).select_related(
            'id_inmueble__propietario', 'id_inmueble__edificio'
        ).values(
            'id_inmueble__id',
            'id_inmueble__propietario__id',
            'id_inmueble__propietario__nombre',
            'id_inmueble__propietario__apellido',
            'id_inmueble__edificio__numero_edificio',
            'id_inmueble__piso',
            'id_inmueble__apartamento'
        ).annotate(
            total_deuda=Sum('saldo_pendiente'),
            recibos_pendientes=Count('id')
        ).order_by('-total_deuda')

        data = []
        for moroso in morosos_query:
            es_moroso = moroso['recibos_pendientes'] > 3
            
            data.append({
                'propietario_id': moroso['id_inmueble__propietario__id'],
                'propietario': f"{moroso['id_inmueble__propietario__nombre']} {moroso['id_inmueble__propietario__apellido']}",
                'inmueble': f"{moroso['id_inmueble__edificio__numero_edificio']}-{moroso['id_inmueble__piso']}{moroso['id_inmueble__apartamento']}",
                'inmueble_id': moroso['id_inmueble__id'],
                'saldo_pendiente': moroso['total_deuda'],
                'recibos_pendientes': moroso['recibos_pendientes'],
                'es_moroso': es_moroso
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def flujo_caja(self, request):
        from django.db.models import Sum
        from .models import Pagos

        from django.utils import timezone as django_timezone
        year = request.query_params.get('year', django_timezone.now().year)
        pagos_por_mes = Pagos.objects.filter(
            estado_verificacion='Verificado',
            fecha_pago__year=year
        ).annotate(
            mes=TruncMonth('fecha_pago')
        ).values('mes').annotate(
            total=Sum('monto_pagado')
        ).order_by('mes')

        return Response(list(pagos_por_mes))
    
    @action(detail=False, methods=['get'])
    def historial_pagos(self, request):
        from .models import Historial_Pagos
        
        propietario_id = request.query_params.get('propietario_id')
        if not propietario_id:
            return Response({'error': 'propietario_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        historial = Historial_Pagos.objects.filter(
            propietario_id=propietario_id
        ).select_related('id_recibo').order_by('-fecha_transaccion')
        
        data = []
        for registro in historial:
            data.append({
                'id': registro.id,
                'recibo': registro.id_recibo.numero_recibo,
                'monto_aplicado': registro.monto_aplicado,
                'monto_credito_generado': registro.monto_credito_generado,
                'tipo_transaccion': registro.get_tipo_transaccion_display(),
                'referencia_bancaria': registro.referencia_bancaria,
                'fecha_transaccion': registro.fecha_transaccion,
                'notas': registro.notas
            })
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def creditos_propietarios(self, request):
        from .models import Creditos_Propietario
        
        creditos = Creditos_Propietario.objects.filter(
            saldo_credito__gt=0
        ).select_related('propietario')
        
        data = []
        for credito in creditos:
            data.append({
                'propietario_id': credito.propietario.id,
                'propietario': f"{credito.propietario.nombre} {credito.propietario.apellido}",
                'saldo_credito': credito.saldo_credito,
                'fecha_actualizacion': credito.fecha_actualizacion
            })
        
        return Response(data)


from rest_framework.views import APIView
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([AllowAny])
def test_connection(request):
    return Response({'message': 'Backend funcionando correctamente'})

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_info(request):
    if request.method == 'GET':
        return Response({
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        })
    elif request.method == 'PUT':
        user = request.user
        user.username = request.data.get('username', user.username)
        user.email = request.data.get('email', user.email)
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.save()
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })
