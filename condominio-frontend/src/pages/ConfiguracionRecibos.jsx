import React, { useState, useEffect } from 'react';
import { condominioService } from '../services/condominioService';

const ConfiguracionRecibos = () => {
  const [configuracion, setConfiguracion] = useState({
    dia_generacion: 1,
    hora_generacion: '08:00',
    dia_recordatorio: 15,
    hora_recordatorio: '10:00',
    activo: true,
    whatsapp_activo: false,
    whatsapp_token: '',
    whatsapp_phone_id: '',
    mensaje_nuevo_recibo: 'Hola {nombre}, tienes un nuevo recibo pendiente por ${monto}. Descarga tu recibo aquí: {link_pdf}',
    mensaje_recordatorio: 'Hola {nombre}, tienes recibos pendientes: {meses_pendientes}. Total adeudado: ${total_deuda}'
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await condominioService.getConfiguracionRecibos();
      console.log('Respuesta de configuración:', response);
      if (response.results && response.results.length > 0) {
        // Buscar la configuración activa o usar la primera
        const configActiva = response.results.find(c => c.activo) || response.results[0];
        console.log('Configuración cargada:', configActiva);
        setConfiguracion({
          ...configuracion,
          ...configActiva
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('Guardando configuración:', configuracion);
    try {
      if (configuracion.id) {
        console.log('Actualizando configuración existente ID:', configuracion.id);
        await condominioService.updateConfiguracionRecibos(configuracion.id, configuracion);
      } else {
        console.log('Creando nueva configuración');
        await condominioService.createConfiguracionRecibos(configuracion);
      }
      setMensaje('Configuración guardada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
      // Recargar configuración después de guardar
      await cargarConfiguracion();
    } catch (error) {
      setMensaje('Error al guardar configuración');
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const generarRecibosAutomatico = async () => {
    setLoading(true);
    try {
      const response = await condominioService.generarRecibosAutomatico();
      setMensaje(`${response.message} - Fecha: ${response.fecha_generacion}`);
    } catch (error) {
      setMensaje('Error en generación automática');
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const enviarRecordatorios = async () => {
    setLoading(true);
    try {
      const response = await condominioService.enviarRecordatorios();
      setMensaje(`Recordatorios enviados: ${response.enviados || 0}`);
    } catch (error) {
      setMensaje('Error enviando recordatorios');
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '24px', color: '#333' }}>Configuración de Recibos</h2>
        
        {mensaje && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: mensaje.includes('Error') ? '#fee' : '#efe',
            color: mensaje.includes('Error') ? '#c33' : '#363',
            borderRadius: '4px',
            border: `1px solid ${mensaje.includes('Error') ? '#fcc' : '#cfc'}`
          }}>
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <h3 style={{ marginBottom: '16px', color: '#555' }}>Generación de Recibos</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Día de Generación:
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={configuracion.dia_generacion}
                  onChange={(e) => setConfiguracion({...configuracion, dia_generacion: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Hora de Generación:
                </label>
                <input
                  type="time"
                  value={configuracion.hora_generacion}
                  onChange={(e) => setConfiguracion({...configuracion, hora_generacion: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '16px', color: '#555' }}>Recordatorios</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Día de Recordatorio:
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={configuracion.dia_recordatorio}
                  onChange={(e) => setConfiguracion({...configuracion, dia_recordatorio: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Hora de Recordatorio:
                </label>
                <input
                  type="time"
                  value={configuracion.hora_recordatorio}
                  onChange={(e) => setConfiguracion({...configuracion, hora_recordatorio: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Configuración WhatsApp */}
          <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '16px', color: '#555' }}>Configuración WhatsApp</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={configuracion.whatsapp_activo}
                  onChange={(e) => setConfiguracion({...configuracion, whatsapp_activo: e.target.checked})}
                />
                <span style={{ fontWeight: 'bold' }}>WhatsApp Activo</span>
              </label>
            </div>

            {configuracion.whatsapp_activo && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Token de WhatsApp:
                    </label>
                    <input
                      type="password"
                      value={configuracion.whatsapp_token}
                      onChange={(e) => setConfiguracion({...configuracion, whatsapp_token: e.target.value})}
                      placeholder="Token de la API de Meta"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Phone Number ID:
                    </label>
                    <input
                      type="text"
                      value={configuracion.whatsapp_phone_id}
                      onChange={(e) => setConfiguracion({...configuracion, whatsapp_phone_id: e.target.value})}
                      placeholder="ID del número de teléfono"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Mensaje Nuevo Recibo:
                  </label>
                  <textarea
                    value={configuracion.mensaje_nuevo_recibo}
                    onChange={(e) => setConfiguracion({...configuracion, mensaje_nuevo_recibo: e.target.value})}
                    rows={3}
                    placeholder="Variables: {nombre}, {monto}, {link_pdf}"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Mensaje Recordatorio:
                  </label>
                  <textarea
                    value={configuracion.mensaje_recordatorio}
                    onChange={(e) => setConfiguracion({...configuracion, mensaje_recordatorio: e.target.value})}
                    rows={3}
                    placeholder="Variables: {nombre}, {meses_pendientes}, {total_deuda}"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={configuracion.activo}
                onChange={(e) => setConfiguracion({...configuracion, activo: e.target.checked})}
              />
              <span style={{ fontWeight: 'bold' }}>Configuración Activa</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>

            <button
              type="button"
              onClick={generarRecibosAutomatico}
              disabled={loading}
              className="btn-secondary"
              style={{ backgroundColor: '#28a745', color: 'white' }}
            >
              {loading ? 'Generando...' : 'Generar Recibos Ahora'}
            </button>

            <button
              type="button"
              onClick={enviarRecordatorios}
              disabled={loading}
              className="btn-secondary"
              style={{ backgroundColor: '#ffc107', color: 'black' }}
            >
              {loading ? 'Enviando...' : 'Enviar Recordatorios WhatsApp'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4 style={{ marginBottom: '12px', color: '#555' }}>Información:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
            <li>Los recibos se generarán automáticamente el día {configuracion.dia_generacion} de cada mes a las {configuracion.hora_generacion}</li>
            <li>Los recordatorios se enviarán el día {configuracion.dia_recordatorio} de cada mes a las {configuracion.hora_recordatorio}</li>
            <li>Los gastos comunes se distribuyen por alícuota</li>
            <li>Los gastos no comunes se dividen en partes iguales entre apartamentos de edificios seleccionados</li>
            {configuracion.whatsapp_activo && (
              <>
                <li style={{ color: '#28a745', fontWeight: 'bold' }}>WhatsApp: Se enviarán notificaciones automáticas a los propietarios</li>
                <li style={{ color: '#28a745' }}>• Notificación inmediata al generar nuevo recibo con PDF adjunto</li>
                <li style={{ color: '#28a745' }}>• Recordatorios automáticos para recibos pendientes</li>
              </>
            )}
          </ul>
          
          {configuracion.whatsapp_activo && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#d4edda', borderRadius: '4px', border: '1px solid #c3e6cb' }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#155724' }}>Configuración WhatsApp Activa</h5>
              <p style={{ margin: 0, fontSize: '14px', color: '#155724' }}>
                Las notificaciones se enviarán automáticamente al teléfono registrado de cada propietario.
                Asegúrate de que los números estén en formato correcto (ej: 04241234567).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionRecibos;