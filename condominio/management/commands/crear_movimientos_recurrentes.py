from django.core.management.base import BaseCommand
from django.utils import timezone
from condominio.models import Gastos_del_Mes, Movimientos_Gastos


class Command(BaseCommand):
    help = 'Crea movimientos automáticos para gastos recurrentes del mes actual'

    def add_arguments(self, parser):
        parser.add_argument(
            '--mes',
            type=str,
            help='Mes de aplicación en formato YYYY-MM (por defecto el mes actual)',
        )

    def handle(self, *args, **options):
        mes_aplicacion = options.get('mes')
        if not mes_aplicacion:
            today = timezone.now().date()
            mes_aplicacion = f"{today.year}-{today.month:02d}"

        # Convertir a date para el primer día del mes
        year, month = map(int, mes_aplicacion.split('-'))
        mes_date = timezone.datetime(year, month, 1).date()

        self.stdout.write(f'Creando movimientos recurrentes para {mes_aplicacion}...')

        # Obtener gastos recurrentes activos
        gastos_recurrentes = Gastos_del_Mes.objects.filter(
            es_recurrente=True,
            estado='Activo'
        )

        movimientos_creados = 0
        for gasto in gastos_recurrentes:
            # Verificar si ya existe un movimiento para este gasto en este mes
            existe = Movimientos_Gastos.objects.filter(
                id_gasto_mes=gasto,
                mes_aplicacion=mes_date
            ).exists()

            if not existe:
                Movimientos_Gastos.objects.create(
                    id_gasto_mes=gasto,
                    monto_real=gasto.monto_base,
                    fecha_gasto=timezone.now().date(),
                    mes_aplicacion=mes_date,
                    descripcion_adicional=f'Movimiento automático recurrente - {mes_aplicacion}'
                )
                movimientos_creados += 1
                self.stdout.write(f'Creado movimiento para {gasto.id_concepto.descripcion}')
            else:
                self.stdout.write(f'Movimiento ya existe para {gasto.id_concepto.descripcion}')

        self.stdout.write(self.style.SUCCESS(f'Se crearon {movimientos_creados} movimientos recurrentes'))