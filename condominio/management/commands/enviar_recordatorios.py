from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum
from condominio.models import Propietario, Recibos
from condominio.whatsapp_service import whatsapp_service


class Command(BaseCommand):
    help = 'Envía recordatorios de pago por WhatsApp a propietarios con recibos pendientes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--solo-morosos',
            action='store_true',
            help='Enviar solo a propietarios morosos (más de 3 recibos pendientes)',
        )

    def handle(self, *args, **options):
        solo_morosos = options.get('solo_morosos', False)
        
        self.stdout.write('Enviando recordatorios de pago por WhatsApp...')

        # Obtener propietarios con recibos pendientes
        propietarios_con_deuda = Propietario.objects.filter(
            inmuebles__recibos__saldo_pendiente__gt=0
        ).distinct()

        recordatorios_enviados = 0
        errores = 0

        for propietario in propietarios_con_deuda:
            try:
                # Obtener recibos pendientes del propietario
                recibos_pendientes = Recibos.objects.filter(
                    id_inmueble__propietario=propietario,
                    saldo_pendiente__gt=0
                ).order_by('fecha_emision')

                if not recibos_pendientes:
                    continue

                # Si solo_morosos está activo, verificar si es moroso
                if solo_morosos and recibos_pendientes.count() <= 3:
                    continue

                # Calcular deuda total
                total_deuda = recibos_pendientes.aggregate(
                    total=Sum('saldo_pendiente')
                )['total'] or 0

                # Enviar recordatorio
                if whatsapp_service.send_payment_reminder(
                    propietario, 
                    recibos_pendientes, 
                    total_deuda
                ):
                    recordatorios_enviados += 1
                    self.stdout.write(
                        f'Recordatorio enviado a {propietario.nombre} {propietario.apellido} '
                        f'({recibos_pendientes.count()} recibos, ${total_deuda})'
                    )
                else:
                    errores += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'No se pudo enviar recordatorio a {propietario.nombre} {propietario.apellido}'
                        )
                    )

            except Exception as e:
                errores += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'Error procesando {propietario.nombre} {propietario.apellido}: {e}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Proceso completado: {recordatorios_enviados} recordatorios enviados, {errores} errores'
            )
        )