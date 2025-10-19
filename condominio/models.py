from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Propietario(models.Model):
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    cedula = models.CharField(max_length=15, unique=True)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(max_length=100)

    class Meta:
        verbose_name_plural = "Propietarios"

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.cedula}"


class Edificio(models.Model):
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]

    numero_edificio = models.CharField(max_length=10, unique=True)
    descripcion = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='Activo')

    class Meta:
        verbose_name_plural = "Edificios"

    def __str__(self):
        return f"Edificio {self.numero_edificio}"


class Inmueble(models.Model):
    propietario = models.ForeignKey(Propietario, on_delete=models.CASCADE, related_name='inmuebles')
    edificio = models.ForeignKey(Edificio, on_delete=models.CASCADE, related_name='inmuebles')
    piso = models.CharField(max_length=5)
    apartamento = models.CharField(max_length=5)
    alicuota = models.DecimalField(
        max_digits=7,
        decimal_places=6,
        validators=[MinValueValidator(Decimal('0.000001')), MaxValueValidator(Decimal('1.000000'))]
    )

    class Meta:
        unique_together = ['edificio', 'piso', 'apartamento']
        verbose_name_plural = "Inmuebles"

    def __str__(self):
        return f"{self.edificio} - Piso {self.piso} Apt {self.apartamento}"


class Tipos_Gasto(models.Model):
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]
    
    TIPO_CALCULO_CHOICES = [
        ('Comun', 'Gasto Común (Por Alícuota)'),
        ('No_Comun', 'Gasto No Común (Partes Iguales)'),
    ]

    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=200)
    tipo_calculo = models.CharField(max_length=10, choices=TIPO_CALCULO_CHOICES, default='Comun')
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='Activo')

    class Meta:
        verbose_name_plural = "Tipos de Gasto"

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_calculo_display()})"


class Conceptos_Gasto(models.Model):
    descripcion = models.CharField(max_length=100)
    id_tipo_gasto = models.ForeignKey(Tipos_Gasto, on_delete=models.CASCADE, related_name='conceptos')

    class Meta:
        verbose_name_plural = "Conceptos de Gasto"

    def __str__(self):
        return self.descripcion


class Gastos_del_Mes(models.Model):
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]
    TIPO_DISTRIBUCION_CHOICES = [
        ('Todos', 'Todos'),
        ('Edificios_Especificos', 'Edificios Específicos'),
    ]

    id_concepto = models.ForeignKey(Conceptos_Gasto, on_delete=models.CASCADE, related_name='gastos_mes')
    monto_base = models.DecimalField(max_digits=10, decimal_places=2)
    es_recurrente = models.BooleanField()
    tipo_distribucion = models.CharField(max_length=25, choices=TIPO_DISTRIBUCION_CHOICES, default='Todos')
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='Activo')

    class Meta:
        verbose_name_plural = "Gastos del Mes"

    def __str__(self):
        return f"{self.id_concepto} - ${self.monto_base}"


class Movimientos_Gastos(models.Model):
    id_gasto_mes = models.ForeignKey(Gastos_del_Mes, on_delete=models.CASCADE, related_name='movimientos')
    monto_real = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_gasto = models.DateField()
    mes_aplicacion = models.DateField()
    descripcion_adicional = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = "Movimientos de Gastos"

    def __str__(self):
        return f"Movimiento {self.id} - {self.fecha_gasto} - ${self.monto_real}"


class Gastos_Edificios(models.Model):
    id_gasto_mes = models.ForeignKey(Gastos_del_Mes, on_delete=models.CASCADE, related_name='gastos_edificios')
    id_edificio = models.ForeignKey(Edificio, on_delete=models.CASCADE, related_name='gastos_edificios')

    class Meta:
        verbose_name_plural = "Gastos por Edificios"
        unique_together = ['id_gasto_mes', 'id_edificio']

    def __str__(self):
        return f"{self.id_gasto_mes} - {self.id_edificio}"


class Movimientos_Edificios(models.Model):
    id_movimiento = models.ForeignKey(Movimientos_Gastos, on_delete=models.CASCADE, related_name='movimientos_edificios')
    id_edificio = models.ForeignKey(Edificio, on_delete=models.CASCADE, related_name='movimientos_edificios')

    class Meta:
        verbose_name_plural = "Movimientos por Edificios"
        unique_together = ['id_movimiento', 'id_edificio']

    def __str__(self):
        return f"{self.id_movimiento} - {self.id_edificio}"


class Recibos(models.Model):
    ESTADO_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Pagado', 'Pagado'),
    ]
    
    numero_recibo = models.CharField(max_length=20, blank=True)
    id_inmueble = models.ForeignKey(Inmueble, on_delete=models.CASCADE, related_name='recibos')
    fecha_emision = models.DateField()
    monto_deuda_anterior = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_cargos_mes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_interes_mora = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_total_pagar = models.DecimalField(max_digits=10, decimal_places=2)
    saldo_pendiente = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='Pendiente')
    
    def save(self, *args, **kwargs):
        if not self.numero_recibo:
            # Generar número: YYYYMM-NNNN
            fecha = self.fecha_emision
            prefijo = fecha.strftime('%Y%m')
            ultimo = Recibos.objects.filter(numero_recibo__startswith=prefijo).count() + 1
            self.numero_recibo = f"{prefijo}-{ultimo:04d}"
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Recibos"

    def __str__(self):
        return f"Recibo {self.numero_recibo} - {self.id_inmueble} - {self.fecha_emision}"
    
    @property
    def recibos_sin_pagar_inmueble(self):
        """Cuenta recibos sin pagar del inmueble para determinar morosidad"""
        return Recibos.objects.filter(
            id_inmueble=self.id_inmueble,
            saldo_pendiente__gt=0
        ).count()
    
    @property
    def es_moroso(self):
        """Determina si el inmueble es moroso (más de 3 recibos sin pagar)"""
        return self.recibos_sin_pagar_inmueble > 3


class Detalles_Recibo(models.Model):
    id_recibo = models.ForeignKey(Recibos, on_delete=models.CASCADE, related_name='detalles')
    id_movimiento = models.ForeignKey(Movimientos_Gastos, on_delete=models.CASCADE, related_name='detalles_recibo', null=True, blank=True)
    descripcion_gasto = models.CharField(max_length=100)
    tipo_gasto = models.CharField(max_length=10, choices=[('Comun', 'Común'), ('No_Comun', 'No Común')], default='Comun')
    monto_calculado = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name_plural = "Detalles de Recibo"

    def __str__(self):
        return f"Detalle {self.id} - {self.descripcion_gasto}"


class Pagos(models.Model):
    ESTADO_VERIFICACION_CHOICES = [
        ('Por Verificar', 'Por Verificar'),
        ('Verificado', 'Verificado'),
        ('Rechazado', 'Rechazado'),
    ]

    id_recibo = models.ForeignKey(Recibos, on_delete=models.CASCADE, related_name='pagos')
    fecha_pago = models.DateField()
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2)
    referencia_bancaria = models.CharField(max_length=50, unique=True)
    metodo_pago = models.CharField(max_length=20, default='Transferencia')
    estado_verificacion = models.CharField(max_length=15, choices=ESTADO_VERIFICACION_CHOICES, default='Por Verificar')
    nota = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = "Pagos"

    def __str__(self):
        return f"Pago {self.id} - Ref: {self.referencia_bancaria}"


class Tasa_Cambio(models.Model):
    fecha = models.DateField(unique=True)
    tasa_bcv = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        verbose_name_plural = "Tasas de Cambio"

    def __str__(self):
        return f"Tasa {self.fecha} - {self.tasa_bcv}"


class Configuracion_Recibos(models.Model):
    dia_generacion = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(31)])
    hora_generacion = models.TimeField(default='08:00')
    dia_recordatorio = models.IntegerField(default=15, validators=[MinValueValidator(1), MaxValueValidator(31)])
    hora_recordatorio = models.TimeField(default='10:00')
    activo = models.BooleanField(default=True)
    
    # Configuración WhatsApp
    whatsapp_activo = models.BooleanField(default=False)
    whatsapp_token = models.CharField(max_length=500, blank=True)
    whatsapp_phone_id = models.CharField(max_length=50, blank=True)
    mensaje_nuevo_recibo = models.TextField(default='Hola {nombre}, tienes un nuevo recibo pendiente por ${monto}. Descarga tu recibo aquí: {link_pdf}')
    mensaje_recordatorio = models.TextField(default='Hola {nombre}, tienes recibos pendientes: {meses_pendientes}. Total adeudado: ${total_deuda}')
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Configuración de Recibos"

    def __str__(self):
        return f"Config - Día {self.dia_generacion} a las {self.hora_generacion}"


class Historial_Pagos(models.Model):
    TIPO_CHOICES = [
        ('Pago_Completo', 'Pago Completo'),
        ('Pago_Parcial', 'Pago Parcial'),
        ('Sobrepago', 'Sobrepago'),
        ('Aplicacion_Credito', 'Aplicación de Crédito'),
    ]
    
    id_recibo = models.ForeignKey(Recibos, on_delete=models.CASCADE, related_name='historial_pagos')
    propietario = models.ForeignKey(Propietario, on_delete=models.CASCADE, related_name='historial_pagos')
    monto_aplicado = models.DecimalField(max_digits=10, decimal_places=2)
    monto_credito_generado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tipo_transaccion = models.CharField(max_length=20, choices=TIPO_CHOICES)
    referencia_bancaria = models.CharField(max_length=50)
    fecha_transaccion = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Historial de Pagos"
    
    def __str__(self):
        return f"Historial {self.id} - {self.tipo_transaccion} - ${self.monto_aplicado}"


class Creditos_Propietario(models.Model):
    propietario = models.OneToOneField(Propietario, on_delete=models.CASCADE, related_name='credito')
    saldo_credito = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Créditos de Propietarios"
    
    def __str__(self):
        return f"Crédito {self.propietario} - ${self.saldo_credito}"