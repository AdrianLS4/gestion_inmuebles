import requests
import json
from condominio.models import Configuracion_Recibos
import logging

logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.config = self._get_config()
    
    def _get_config(self):
        try:
            return Configuracion_Recibos.objects.filter(whatsapp_activo=True).first()
        except:
            return None
    
    def send_message(self, phone_number, message, pdf_url=None):
        """Envía mensaje de WhatsApp usando la API de Meta"""
        if not self.config or not self.config.whatsapp_activo:
            logger.warning("WhatsApp no está configurado o activo")
            return False
        
        # Modo de prueba - simular envío exitoso
        if self.config.whatsapp_token == 'MODO_PRUEBA':
            logger.info(f"MODO PRUEBA - Mensaje simulado a {phone_number}: {message}")
            print(f"📱 WhatsApp simulado a {phone_number}: {message[:50]}...")
            return True
        
        # Limpiar número de teléfono
        phone = self._clean_phone_number(phone_number)
        if not phone:
            logger.error(f"Número de teléfono inválido: {phone_number}")
            return False
        
        url = f"https://graph.facebook.com/v18.0/{self.config.whatsapp_phone_id}/messages"
        headers = {
            'Authorization': f'Bearer {self.config.whatsapp_token}',
            'Content-Type': 'application/json'
        }
        
        # Usar template hello_world temporalmente
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "template",
            "template": {
                "name": "hello_world",
                "language": {"code": "en_US"}
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            # Si hay PDF, enviarlo como documento
            if pdf_url:
                self._send_document(phone, pdf_url)
            
            logger.info(f"Mensaje enviado exitosamente a {phone}")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enviando mensaje WhatsApp: {e}")
            # Si es error 131030 (número no permitido), sugerir solución
            if '131030' in str(e):
                logger.warning(f"Número {phone} no está en lista permitida. Agrega en Meta for Developers.")
                print(f"⚠️  Número {phone_number} no permitido. Agrégalo en Meta for Developers.")
            return False
    
    def _send_document(self, phone, pdf_url):
        """Envía documento PDF por WhatsApp"""
        url = f"https://graph.facebook.com/v18.0/{self.config.whatsapp_phone_id}/messages"
        headers = {
            'Authorization': f'Bearer {self.config.whatsapp_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "document",
            "document": {
                "link": pdf_url,
                "filename": "recibo.pdf",
                "caption": "Tu recibo de condominio"
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            logger.info(f"PDF enviado exitosamente a {phone}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enviando PDF WhatsApp: {e}")
            return False
    
    def _clean_phone_number(self, phone):
        """Limpia y formatea número de teléfono para WhatsApp"""
        if not phone:
            return None
        
        # Remover caracteres no numéricos
        phone = ''.join(filter(str.isdigit, phone))
        
        # Agregar código de país si no lo tiene (Venezuela +58)
        if len(phone) == 10 and phone.startswith('4'):
            phone = '58' + phone
        elif len(phone) == 11 and phone.startswith('04'):
            phone = '58' + phone[1:]
        
        return phone if len(phone) >= 10 else None
    
    def send_new_receipt_notification(self, propietario, recibo, pdf_url=None):
        """Envía notificación de nuevo recibo"""
        if not propietario.telefono:
            return False
        
        message = self.config.mensaje_nuevo_recibo.format(
            nombre=propietario.nombre,
            monto=recibo.monto_total_pagar,
            link_pdf=pdf_url or "Disponible en el sistema"
        )
        
        return self.send_message(propietario.telefono, message, pdf_url)
    
    def send_payment_reminder(self, propietario, recibos_pendientes, total_deuda):
        """Envía recordatorio de pago usando template"""
        if not propietario.telefono:
            return False
        
        phone = self._clean_phone_number(propietario.telefono)
        if not phone:
            return False
            
        url = f"https://graph.facebook.com/v18.0/{self.config.whatsapp_phone_id}/messages"
        headers = {
            'Authorization': f'Bearer {self.config.whatsapp_token}',
            'Content-Type': 'application/json'
        }
        
        # Preparar meses pendientes
        meses_pendientes = ", ".join([
            recibo.fecha_emision.strftime('%m/%Y') 
            for recibo in recibos_pendientes
        ])
        
        # Intentar usar template personalizado, si falla usar hello_world
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "template",
            "template": {
                "name": "recibo_condominio",
                "language": {"code": "es"},
                "components": [{
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": propietario.nombre},
                        {"type": "text", "text": meses_pendientes},
                        {"type": "text", "text": str(total_deuda)}
                    ]
                }]
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            logger.info(f"Template personalizado enviado a {propietario.nombre}")
            return True
        except requests.exceptions.RequestException as e:
            # Si falla el template personalizado, usar hello_world
            logger.warning(f"Template personalizado falló, usando hello_world: {e}")
            payload["template"] = {
                "name": "hello_world",
                "language": {"code": "en_US"}
            }
            try:
                response = requests.post(url, headers=headers, json=payload)
                response.raise_for_status()
                logger.info(f"Hello World enviado a {propietario.nombre}")
                return True
            except requests.exceptions.RequestException as e2:
                logger.error(f"Error enviando template: {e2}")
                return False

# Instancia global del servicio
whatsapp_service = WhatsAppService()