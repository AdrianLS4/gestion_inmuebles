import api from './api';

export const authService = {
  login: async (username, password) => {
    try {
      console.log('Enviando request a /auth/login/');
      const response = await api.post('/auth/login/', { username, password });
      console.log('Respuesta del servidor:', response);
      console.log('Tipo de respuesta:', typeof response);
      console.log('Keys de respuesta:', Object.keys(response));
      if (response.token) {
        localStorage.setItem('token', response.token);
        console.log('Token guardado en localStorage:', response.token);
      } else {
        console.log('No se encontró token en la respuesta');
      }
      return response;
    } catch (error) {
      console.error('Error en authService.login:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getUserInfo: async () => {
    return api.get('/auth/user/');
  },

  updateProfile: async (data) => {
    return api.put('/auth/user/', data);
  }
};

export const condominioService = {
  // Propietarios
  getPropietarios: () => api.get('/propietarios/'),
  createPropietario: (data) => api.post('/propietarios/', data),
  updatePropietario: (id, data) => api.put(`/propietarios/${id}/`, data),
  deletePropietario: (id) => api.delete(`/propietarios/${id}/`),

  // Edificios
  getEdificios: () => api.get('/edificios/'),
  createEdificio: (data) => api.post('/edificios/', data),
  updateEdificio: (id, data) => api.put(`/edificios/${id}/`, data),
  deleteEdificio: (id) => api.delete(`/edificios/${id}/`),

  // Inmuebles
  getInmuebles: () => api.get('/inmuebles/'),
  createInmueble: (data) => api.post('/inmuebles/', data),
  updateInmueble: (id, data) => api.put(`/inmuebles/${id}/`, data),
  deleteInmueble: (id) => api.delete(`/inmuebles/${id}/`),

  // Gastos
  getTiposGasto: () => api.get('/tipos-gasto/'),
  createTipoGasto: (data) => api.post('/tipos-gasto/', data),
  updateTipoGasto: (id, data) => api.put(`/tipos-gasto/${id}/`, data),
  deleteTipoGasto: (id) => api.delete(`/tipos-gasto/${id}/`),
  getConceptosGasto: () => api.get('/conceptos-gasto/'),
  createConceptoGasto: (data) => api.post('/conceptos-gasto/', data),
  updateConceptoGasto: (id, data) => api.put(`/conceptos-gasto/${id}/`, data),
  updateGastoMes: (id, data) => api.put(`/gastos-mes/${id}/`, data),
  deleteConceptoGasto: (id) => api.delete(`/conceptos-gasto/${id}/`),
  getGastosMes: () => api.get('/gastos-mes/'),
  createGastoMes: (data) => api.post('/gastos-mes/', data),
  agregarEdificioGasto: (gastoId, edificioId) => api.post(`/gastos-mes/${gastoId}/agregar_edificio/`, { edificio_id: edificioId }),
  eliminarEdificioGasto: (gastoId, edificioId) => api.delete(`/gastos-mes/${gastoId}/eliminar_edificio/`, { data: { edificio_id: edificioId } }),
  getMovimientosGastos: () => api.get('/movimientos-gastos/'),
  createMovimientoGasto: (data) => api.post('/movimientos-gastos/', data),

  // Recibos
  getRecibos: (params = '') => {
    const timestamp = new Date().getTime()
    const separator = params ? '&' : '?'
    return api.get(`/recibos/${params ? '?' + params : ''}${separator}_t=${timestamp}`)
  },
  registrarPago: (reciboId, data) => api.post(`/recibos/${reciboId}/registrar_pago/`, data),

  // Pagos
  getPagos: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/pagos/${queryString ? '?' + queryString : ''}`)
  },
  verificarPago: (id, formData) => api.post(`/pagos/${id}/verificar/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  rechazarPago: (id, data) => api.post(`/pagos/${id}/rechazar/`, data),
  verificarMultiplesPagos: (data) => api.post('/pagos/verificar_multiples/', data),

  // Reportes
  getMorosos: () => {
    const timestamp = new Date().getTime()
    return api.get(`/reportes/morosos/?_t=${timestamp}`)
  },
  getFlujoCaja: (year) => api.get(`/reportes/flujo_caja/?year=${year}`),
  getHistorialPagos: (propietarioId) => api.get(`/reportes/historial_pagos/?propietario_id=${propietarioId}`),
  getCreditosPropietarios: () => api.get('/reportes/creditos_propietarios/'),


  // Tasas de cambio
  getTasasCambio: () => api.get('/tasas-cambio/'),
  createTasaCambio: (data) => api.post('/tasas-cambio/', data),

  // Generar recibos
  generarRecibos: (mesAplicacion) => api.post('/recibos/generar_recibos/', { mes_aplicacion: mesAplicacion }),
  actualizarRecibos: (mesAplicacion) => api.post('/recibos/actualizar_recibos/', { mes_aplicacion: mesAplicacion }),

  // Configuración de recibos
  getConfiguracionRecibos: () => api.get('/configuracion-recibos/'),
  createConfiguracionRecibos: (data) => api.post('/configuracion-recibos/', data),
  updateConfiguracionRecibos: (id, data) => api.put(`/configuracion-recibos/${id}/`, data),
  generarRecibosAutomatico: () => api.post('/configuracion-recibos/generar_automatico/'),
  enviarRecordatorios: () => api.post('/configuracion-recibos/enviar_recordatorios/'),
  
  // PDF
  descargarReciboPDF: (reciboId) => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/recibos/${reciboId}/pdf/`;
    window.open(`${url}?token=${token}`, '_blank');
  },
};