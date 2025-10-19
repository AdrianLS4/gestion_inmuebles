from django.core.management.base import BaseCommand
from django.utils import timezone
from condominio.models import Inmueble, Movimientos_Gastos, Gastos_del_Mes
from condominio.services import generar_recibo_mensual
from condominio.whatsapp_service import whatsapp_service


class Command(BaseCommand):
    help = 'Genera recibos mensuales para todos los inmuebles'

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

        self.stdout.write(f'Generando recibos para {mes_aplicacion}...')

        # Obtener movimientos del mes
        movimientos = Movimientos_Gastos.objects.filter(
            mes_aplicacion=mes_date
        ).select_related('id_gasto_mes__id_concepto')

        if not movimientos:
            self.stdout.write(self.style.WARNING('No hay movimientos para este mes'))
            return

        # Obtener todos los inmuebles activos
        inmuebles = Inmueble.objects.all()

        recibos_generados = 0
        notificaciones_enviadas = 0
        
        for inmueble in inmuebles:
            try:
                recibo = generar_recibo_mensual(inmueble, mes_date, movimientos)
                self.stdout.write(f'Recibo generado para {inmueble}: {recibo.monto_total_pagar}')
                recibos_generados += 1
                
                # Enviar notificación WhatsApp
                try:
                    pdf_url = f"http://localhost:8000/api/recibos/{recibo.id}/pdf/"
                    if whatsapp_service.send_new_receipt_notification(inmueble.propietario, recibo, pdf_url):
                        notificaciones_enviadas += 1
                        self.stdout.write(f'Notificación WhatsApp enviada a {inmueble.propietario.nombre}')
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Error enviando WhatsApp a {inmueble.propietario.nombre}: {e}'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error generando recibo para {inmueble}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Se generaron {recibos_generados} recibos exitosamente'))
        self.stdout.write(self.style.SUCCESS(f'Se enviaron {notificaciones_enviadas} notificaciones WhatsApp'))