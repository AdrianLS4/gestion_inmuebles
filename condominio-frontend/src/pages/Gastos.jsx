import { useState, useEffect } from 'react';
import { condominioService } from '../services/condominioService';
import { Plus, Edit, Trash2, Calculator, TrendingUp, Building2, DollarSign, Calendar, Users } from 'lucide-react';

export default function Gastos() {
  const [activeTab, setActiveTab] = useState('tipos');
  const [loading, setLoading] = useState(true);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [gastosMes, setGastosMes] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [edificios, setEdificios] = useState([]);
  
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', descripcion: '', tipo_calculo: 'Comun', estado: 'Activo' });
  const [editandoTipo, setEditandoTipo] = useState(null);
  const [modalConcepto, setModalConcepto] = useState(null);
  const [editConcepto, setEditConcepto] = useState({ descripcion: '', monto: '', edificios: [], activo: true });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({
    concepto: '',
    monto: '',
    tipoGastoId: '',
    esRecurrente: false,
    distribucion: 'comun',
    edificiosEspecificos: false,
    edificiosSeleccionados: [],
    activoEnRecibo: true,
  });
  
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    id_gasto_mes: '',
    monto_real: '',
    fecha_gasto: new Date().toISOString().split('T')[0],
    mes_aplicacion: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
    descripcion_adicional: ''
  });
  
  const [filtroFecha, setFiltroFecha] = useState('');
  
  // Función para obtener el mes anterior
  const getMesAnterior = () => {
    const hoy = new Date();
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    return mesAnterior.toISOString().slice(0, 7);
  };
  
  // Filtrar movimientos por fecha
  const movimientosFiltrados = movimientos.filter(movimiento => {
    if (!filtroFecha) {
      // Sin filtro: mostrar del mes anterior hacia atrás
      const fechaMovimiento = movimiento.fecha_gasto.slice(0, 7); // YYYY-MM
      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 7);
      return fechaMovimiento <= mesAnterior;
    } else {
      // Con filtro: mostrar solo del mes seleccionado
      const fechaMovimiento = movimiento.fecha_gasto.slice(0, 7);
      return fechaMovimiento === filtroFecha;
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tiposRes, conceptosRes, gastosRes, movimientosRes, edificiosRes] = await Promise.all([
        condominioService.getTiposGasto(),
        condominioService.getConceptosGasto(),
        condominioService.getGastosMes(),
        condominioService.getMovimientosGastos(),
        condominioService.getEdificios()
      ]);
      
      setTiposGasto(tiposRes?.results || tiposRes || []);
      setConceptos(conceptosRes?.results || conceptosRes || []);
      setGastosMes(gastosRes?.results || gastosRes || []);
      setMovimientos(movimientosRes?.results || movimientosRes || []);
      setEdificios(edificiosRes?.results || edificiosRes || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateTipo = () => {
    const newErrors = {};
    if (!nuevoTipo.nombre.trim()) newErrors.nombre = 'Nombre es requerido';
    if (nuevoTipo.nombre.length < 3) newErrors.nombre = 'Mínimo 3 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGasto = () => {
    const newErrors = {};
    if (!nuevoGasto.concepto.trim()) newErrors.concepto = 'Concepto es requerido';
    if (!nuevoGasto.monto || parseFloat(nuevoGasto.monto) <= 0) newErrors.monto = 'Monto debe ser mayor a 0';
    if (!nuevoGasto.tipoGastoId) newErrors.tipoGastoId = 'Tipo de gasto es requerido';
    const tipoSeleccionado = tiposGasto.find(t => t.id == nuevoGasto.tipoGastoId);
    if (tipoSeleccionado?.tipo_calculo === 'No_Comun' && nuevoGasto.edificiosSeleccionados.length === 0) {
      newErrors.edificios = 'Selecciona al menos un edificio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMovimiento = () => {
    const newErrors = {};
    if (!nuevoMovimiento.id_gasto_mes) newErrors.id_gasto_mes = 'Plantilla es requerida';
    if (!nuevoMovimiento.monto_real || parseFloat(nuevoMovimiento.monto_real) <= 0) newErrors.monto_real = 'Monto debe ser mayor a 0';
    if (!nuevoMovimiento.fecha_gasto) newErrors.fecha_gasto = 'Fecha es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTipo = async () => {
    if (!validateTipo()) return;
    setIsSubmitting(true);
    
    try {
      await condominioService.createTipoGasto(nuevoTipo);
      setNuevoTipo({ nombre: '', descripcion: '', tipo_calculo: 'Comun', estado: 'Activo' });
      setErrors({});
      loadData();
    } catch (error) {
      console.error('Error creating tipo:', error);
      alert('Error al crear tipo de gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGasto = async () => {
    if (!validateGasto()) return;
    setIsSubmitting(true);
    
    try {
      const tipoSeleccionado = tiposGasto.find(t => t.id == nuevoGasto.tipoGastoId);
      
      // Primero crear el concepto
      const conceptoData = {
        descripcion: nuevoGasto.concepto,
        id_tipo_gasto: parseInt(nuevoGasto.tipoGastoId)
      };
      const conceptoRes = await condominioService.createConceptoGasto(conceptoData);
      
      // Luego crear el gasto del mes
      const gastoData = {
        id_concepto: conceptoRes.id,
        monto_base: parseFloat(nuevoGasto.monto),
        es_recurrente: nuevoGasto.esRecurrente,
        tipo_distribucion: tipoSeleccionado?.tipo_calculo === 'No_Comun' ? 'Edificios_Especificos' : 'Todos',
        estado: nuevoGasto.activoEnRecibo ? 'Activo' : 'Inactivo'
      };
      
      // Si es No Común, también enviar los edificios seleccionados
      if (tipoSeleccionado?.tipo_calculo === 'No_Comun') {
        gastoData.edificios_seleccionados = nuevoGasto.edificiosSeleccionados;
      }
      await condominioService.createGastoMes(gastoData);
      
      setNuevoGasto({
        concepto: '',
        monto: '',
        tipoGastoId: '',
        esRecurrente: false,
        distribucion: 'comun',
        edificiosEspecificos: false,
        edificiosSeleccionados: [],
        activoEnRecibo: true,
      });
      setErrors({});
      loadData();
      alert('Gasto creado exitosamente');
    } catch (error) {
      console.error('Error creating gasto:', error);
      alert('Error al crear gasto: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMovimiento = async () => {
    if (!validateMovimiento()) return;
    setIsSubmitting(true);
    
    try {
      await condominioService.createMovimientoGasto(nuevoMovimiento);
      setNuevoMovimiento({
        id_gasto_mes: '',
        monto_real: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        mes_aplicacion: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
        descripcion_adicional: ''
      });
      setErrors({});
      loadData();
      alert('Movimiento creado exitosamente');
    } catch (error) {
      console.error('Error creating movimiento:', error);
      alert('Error al crear movimiento: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTipo = async (id) => {
    if (confirm('¿Estás seguro de eliminar este tipo de gasto?')) {
      try {
        await condominioService.deleteTipoGasto(id);
        loadData();
        alert('Tipo eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleDeleteConcepto = async (id) => {
    if (confirm('¿Estás seguro de eliminar este concepto?')) {
      try {
        await condominioService.deleteConceptoGasto(id);
        loadData();
        alert('Concepto eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleEditTipo = (tipo) => {
    setEditandoTipo(tipo);
    setNuevoTipo({ ...tipo });
  };

  const handleUpdateTipo = async () => {
    try {
      await condominioService.updateTipoGasto(editandoTipo.id, nuevoTipo);
      setEditandoTipo(null);
      setNuevoTipo({ nombre: '', descripcion: '', tipo_calculo: 'Comun', estado: 'Activo' });
      loadData();
      alert('Tipo actualizado exitosamente');
    } catch (error) {
      alert('Error al actualizar: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditConcepto = (concepto) => {
    const gastoMes = gastosMes.find(g => g.id_concepto?.id === concepto.id);
    setEditConcepto({
      descripcion: concepto.descripcion,
      monto: gastoMes?.monto_base || '',
      edificios: [],
      activo: gastoMes?.estado === 'Activo'
    });
    setModalConcepto(concepto);
  };

  const handleUpdateConcepto = async () => {
    try {
      await condominioService.updateConceptoGasto(modalConcepto.id, { 
        descripcion: editConcepto.descripcion, 
        id_tipo_gasto: modalConcepto.id_tipo_gasto.id 
      });
      const gastoMes = gastosMes.find(g => g.id_concepto?.id === modalConcepto.id);
      if (gastoMes) {
        await condominioService.updateGastoMes(gastoMes.id, {
          ...gastoMes,
          monto_base: parseFloat(editConcepto.monto),
          estado: editConcepto.activo ? 'Activo' : 'Inactivo'
        });
      }
      setModalConcepto(null);
      loadData();
      alert('Concepto actualizado exitosamente');
    } catch (error) {
      alert('Error al actualizar: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAgregarEdificioGasto = async (gastoId, edificioId) => {
    try {
      await condominioService.agregarEdificioGasto(gastoId, edificioId);
      loadData();
    } catch (error) {
      alert('Error al agregar edificio: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEliminarEdificioGasto = async (gastoId, edificioId) => {
    if (confirm('¿Estás seguro de eliminar este edificio del gasto?')) {
      try {
        await condominioService.eliminarEdificioGasto(gastoId, edificioId);
        loadData();
      } catch (error) {
        alert('Error al eliminar edificio: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const totalGastosComunes = gastosMes
    .filter((g) => {
      const concepto = conceptos.find(c => c.id === g.id_concepto?.id);
      const tipo = tiposGasto.find(t => t.id === concepto?.id_tipo_gasto?.id);
      return tipo?.tipo_calculo === 'Comun' && g.estado === 'Activo';
    })
    .reduce((sum, g) => sum + parseFloat(g.monto_base || 0), 0);

  const totalGastosNoComunes = gastosMes
    .filter((g) => {
      const concepto = conceptos.find(c => c.id === g.id_concepto?.id);
      const tipo = tiposGasto.find(t => t.id === concepto?.id_tipo_gasto?.id);
      return tipo?.tipo_calculo === 'No_Comun' && g.estado === 'Activo';
    })
    .reduce((sum, g) => sum + parseFloat(g.monto_base || 0), 0);

  if (loading) {
    return <div style={{padding: '24px', textAlign: 'center'}}>Cargando datos...</div>;
  }

  const tabs = [
    { id: 'tipos', label: 'Tipos de Gasto' },
    { id: 'conceptos', label: 'Conceptos' },
    { id: 'gastos', label: 'Gastos del Mes' },
    { id: 'movimientos', label: 'Movimientos' },
  ];

  return (
    <div style={{padding: '0'}}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
        }
        .input-error {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
      <div style={{marginBottom: '24px'}}>
        <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px'}}>Gestión de Gastos</h1>
        <p style={{color: '#6b7280', fontSize: '16px'}}>Administra tipos de gastos, conceptos y movimientos mensuales</p>
      </div>

      {/* Cards de resumen */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px'}}>
        <div className="card" style={{border: '2px solid #bbf7d0', backgroundColor: '#f0fdf4'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', color: '#166534'}}>Gastos Comunes</h3>
            <Calculator style={{width: '16px', height: '16px', color: '#16a34a'}} />
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#14532d'}}>${totalGastosComunes.toLocaleString()}</div>
          <p style={{fontSize: '12px', color: '#16a34a'}}>Por alícuota</p>
        </div>

        <div className="card" style={{border: '2px solid #fed7aa', backgroundColor: '#fff7ed'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', color: '#9a3412'}}>Gastos No Comunes</h3>
            <Users style={{width: '16px', height: '16px', color: '#ea580c'}} />
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#7c2d12'}}>${totalGastosNoComunes.toLocaleString()}</div>
          <p style={{fontSize: '12px', color: '#ea580c'}}>Partes iguales</p>
        </div>

        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', color: '#374151'}}>Total Mensual</h3>
            <DollarSign style={{width: '16px', height: '16px', color: '#6b7280'}} />
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#111827'}}>${(totalGastosComunes + totalGastosNoComunes).toLocaleString()}</div>
          <p style={{fontSize: '12px', color: '#6b7280'}}>Enero 2024</p>
        </div>

        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', color: '#374151'}}>Conceptos Activos</h3>
            <TrendingUp style={{width: '16px', height: '16px', color: '#6b7280'}} />
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#111827'}}>{gastosMes.filter(g => g.estado === 'Activo').length}</div>
          <p style={{fontSize: '12px', color: '#6b7280'}}>Este mes</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', borderBottom: '1px solid #e5e7eb'}}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === tab.id ? '600' : '400',
                fontSize: '14px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'tipos' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
          <div className="card">
            <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Nuevo Tipo de Gasto</h3>
            <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '16px'}}>Define cómo se calculará y distribuirá este tipo de gasto</p>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Nombre del Tipo</label>
                <input
                  type="text"
                  value={nuevoTipo.nombre}
                  onChange={(e) => {
                    setNuevoTipo({ ...nuevoTipo, nombre: e.target.value });
                    if (errors.nombre) setErrors({...errors, nombre: ''});
                  }}
                  placeholder="Ej: Mantenimiento"
                  style={{
                    width: '100%', 
                    padding: '8px 12px', 
                    border: `2px solid ${errors.nombre ? '#ef4444' : '#e5e7eb'}`, 
                    borderRadius: '6px',
                    transition: 'all 0.3s ease',
                    backgroundColor: errors.nombre ? '#fef2f2' : 'white'
                  }}
                />
                {errors.nombre && (
                  <p style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', animation: 'fadeIn 0.3s ease'}}>
                    {errors.nombre}
                  </p>
                )}
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Descripción</label>
                <textarea
                  value={nuevoTipo.descripcion}
                  onChange={(e) => setNuevoTipo({ ...nuevoTipo, descripcion: e.target.value })}
                  placeholder="Describe el tipo de gasto"
                  rows={3}
                  style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', resize: 'vertical'}}
                />
              </div>
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
              <input
                type="checkbox"
                id="es-comun"
                checked={nuevoTipo.tipo_calculo === 'Comun'}
                onChange={(e) => setNuevoTipo({ ...nuevoTipo, tipo_calculo: e.target.checked ? 'Comun' : 'No_Comun' })}
              />
              <label htmlFor="es-comun" style={{fontSize: '14px'}}>
                {nuevoTipo.tipo_calculo === 'Comun' ? (
                  <span style={{padding: '4px 8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '12px'}}>
                    Gasto Común (por alícuota)
                  </span>
                ) : (
                  <span style={{padding: '4px 8px', backgroundColor: '#fed7aa', color: '#9a3412', borderRadius: '4px', fontSize: '12px'}}>
                    Gasto No Común (partes iguales)
                  </span>
                )}
              </label>
            </div>

            <div style={{display: 'flex', gap: '12px'}}>
              <button 
                onClick={editandoTipo ? handleUpdateTipo : handleCreateTipo}
                disabled={!nuevoTipo.nombre.trim() || nuevoTipo.nombre.length < 3 || isSubmitting}
                className="btn-primary" 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  opacity: (!nuevoTipo.nombre.trim() || nuevoTipo.nombre.length < 3 || isSubmitting) ? 0.5 : 1,
                  cursor: (!nuevoTipo.nombre.trim() || nuevoTipo.nombre.length < 3 || isSubmitting) ? 'not-allowed' : 'pointer',
                  transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Plus style={{width: '16px', height: '16px'}} />
                {isSubmitting ? 'Guardando...' : (editandoTipo ? 'Actualizar Tipo' : 'Agregar Tipo')}
              </button>
              {editandoTipo && (
                <button 
                  onClick={() => {
                    setEditandoTipo(null);
                    setNuevoTipo({ nombre: '', descripcion: '', tipo_calculo: 'Comun', estado: 'Activo' });
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>Tipos de Gasto Existentes</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {tiposGasto.map((tipo) => (
                <div key={tipo.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px'}}>
                      <h4 style={{fontWeight: '500', margin: 0}}>{tipo.nombre}</h4>
                      {tipo.tipo_calculo === 'Comun' ? (
                        <span style={{padding: '2px 6px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '12px'}}>Común</span>
                      ) : (
                        <span style={{padding: '2px 6px', backgroundColor: '#fed7aa', color: '#9a3412', borderRadius: '4px', fontSize: '12px'}}>No Común</span>
                      )}
                    </div>
                    <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>{tipo.descripcion}</p>
                  </div>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={() => handleEditTipo(tipo)} style={{padding: '6px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer'}}>
                      <Edit style={{width: '16px', height: '16px'}} />
                    </button>
                    <button onClick={() => handleDeleteTipo(tipo.id)} style={{padding: '6px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer'}}>
                      <Trash2 style={{width: '16px', height: '16px'}} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conceptos' && (
        <div className="card">
          <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Conceptos de Gasto</h3>
          <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '16px'}}>Lista de conceptos específicos por tipo de gasto</p>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {conceptos.map((concepto) => {
              const tipo = concepto.id_tipo_gasto;
              const gastoMes = gastosMes.find(g => g.id_concepto?.id === concepto.id);
              const isInactive = gastoMes?.estado === 'Inactivo';
              const edificiosSeleccionados = gastoMes?.edificios_seleccionados || [];
              const esNoComun = tipo?.tipo_calculo === 'No_Comun';
              const montoPorEdificio = esNoComun && edificiosSeleccionados.length > 0 ? 
                parseFloat(gastoMes?.monto_base || 0) / edificiosSeleccionados.length : 0;
              
              return (
                <div key={concepto.id} style={{
                  padding: '16px', 
                  border: `1px solid ${isInactive ? '#fca5a5' : '#e5e7eb'}`, 
                  borderRadius: '8px',
                  backgroundColor: isInactive ? '#fef2f2' : 'white'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px'}}>
                        <h4 style={{fontWeight: '500', margin: 0, color: isInactive ? '#991b1b' : 'inherit'}}>{concepto.descripcion}</h4>
                        {tipo && (
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: tipo.tipo_calculo === 'Comun' ? '#dcfce7' : '#fed7aa',
                            color: tipo.tipo_calculo === 'Comun' ? '#166534' : '#9a3412',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {tipo.nombre}
                          </span>
                        )}
                        {isInactive && (
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: '#fecaca',
                            color: '#991b1b',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p style={{fontSize: '14px', color: isInactive ? '#991b1b' : '#6b7280', margin: 0}}>Monto: ${parseFloat(gastoMes?.monto_base || 0).toLocaleString()}</p>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button onClick={() => handleEditConcepto(concepto)} style={{padding: '6px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer'}}>
                        <Edit style={{width: '16px', height: '16px'}} />
                      </button>
                      <button onClick={() => handleDeleteConcepto(concepto.id)} style={{padding: '6px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer'}}>
                        <Trash2 style={{width: '16px', height: '16px'}} />
                      </button>
                    </div>
                  </div>
                  
                  {esNoComun && edificiosSeleccionados.length > 0 && (
                    <div style={{marginTop: '8px', padding: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '4px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{fontSize: '12px', color: '#9a3412', fontWeight: '500'}}>
                          {edificiosSeleccionados.length} edificio(s) seleccionado(s)
                        </span>
                        <span style={{fontSize: '12px', color: '#9a3412', fontWeight: '500'}}>
                          ${montoPorEdificio.toLocaleString()} por edificio
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Editar Concepto */}
      {modalConcepto && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, transition: 'opacity 0.3s ease'}}>
          <div style={{backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '80vh', overflow: 'auto', transform: 'scale(1)', transition: 'transform 0.3s ease'}}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '16px'}}>Editar Concepto</h3>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Descripción</label>
              <input
                type="text"
                value={editConcepto.descripcion}
                onChange={(e) => setEditConcepto({...editConcepto, descripcion: e.target.value})}
                style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px'}}
              />
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Monto Base</label>
              <input
                type="number"
                value={editConcepto.monto}
                onChange={(e) => setEditConcepto({...editConcepto, monto: e.target.value})}
                style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px'}}
              />
            </div>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
              <input
                type="checkbox"
                id="activo-modal"
                checked={editConcepto.activo}
                onChange={(e) => setEditConcepto({...editConcepto, activo: e.target.checked})}
              />
              <label htmlFor="activo-modal" style={{fontSize: '14px', fontWeight: '500'}}>
                {editConcepto.activo ? (
                  <span style={{color: '#16a34a'}}>✓ Activo en recibo</span>
                ) : (
                  <span style={{color: '#dc2626'}}>✗ Inactivo en recibo</span>
                )}
              </label>
            </div>
            
            {modalConcepto.id_tipo_gasto?.tipo_calculo === 'No_Comun' && (
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>Edificios Seleccionados</label>
                
                {(() => {
                  const gastoMes = gastosMes.find(g => g.id_concepto?.id === modalConcepto.id);
                  const edificiosSeleccionados = gastoMes?.edificios_seleccionados || [];
                  const montoPorEdificio = edificiosSeleccionados.length > 0 ? 
                    parseFloat(editConcepto.monto || gastoMes?.monto_base || 0) / edificiosSeleccionados.length : 0;
                  
                  return (
                    <div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px', backgroundColor: '#fff7ed', borderRadius: '4px'}}>
                        <span style={{fontSize: '12px', color: '#9a3412', fontWeight: '500'}}>Total edificios: {edificiosSeleccionados.length}</span>
                        {edificiosSeleccionados.length > 0 && (
                          <span style={{fontSize: '12px', color: '#9a3412', fontWeight: '500'}}>
                            ${montoPorEdificio.toLocaleString()} por edificio
                          </span>
                        )}
                      </div>
                      
                      {edificiosSeleccionados.length > 0 ? (
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px'}}>
                          {edificiosSeleccionados.map((edificio) => (
                            <div key={edificio.id} style={{
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              padding: '4px 8px', 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              <span>Edificio {edificio.numero_edificio}</span>
                              <button 
                                onClick={async () => {
                                  await handleEliminarEdificioGasto(gastoMes.id, edificio.id);
                                  loadData();
                                }}
                                style={{
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#dc2626', 
                                  cursor: 'pointer', 
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Eliminar edificio"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{fontSize: '12px', color: '#9a3412', margin: '0 0 12px 0', padding: '8px', backgroundColor: '#fef2f2', borderRadius: '4px'}}>No hay edificios seleccionados</p>
                      )}
                      
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <select 
                          onChange={async (e) => {
                            if (e.target.value) {
                              await handleAgregarEdificioGasto(gastoMes.id, parseInt(e.target.value));
                              loadData();
                              e.target.value = '';
                            }
                          }}
                          style={{fontSize: '12px', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', flex: 1}}
                        >
                          <option value="">+ Agregar edificio</option>
                          {edificios
                            .filter(ed => !edificiosSeleccionados.some(sel => sel.id === ed.id))
                            .map((edificio) => (
                              <option key={edificio.id} value={edificio.id}>
                                Edificio {edificio.numero_edificio} - {edificio.descripcion}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button 
                onClick={() => setModalConcepto(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateConcepto}
                className="btn-primary"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gastos' && (
        <div className="card">
          <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Nuevo Gasto del Mes</h3>
          <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '16px'}}>Registra un nuevo gasto para el mes actual</p>
          
          {tiposGasto.length === 0 && (
            <div style={{padding: '20px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', marginBottom: '16px'}}>
              <p style={{color: '#92400e', margin: 0}}>⚠️ Primero debes crear al menos un tipo de gasto en la pestaña "Tipos de Gasto"</p>
            </div>
          )}
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Tipo de Gasto</label>
              <select
                value={nuevoGasto.tipoGastoId}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, tipoGastoId: e.target.value })}
                disabled={tiposGasto.length === 0}
                style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', opacity: tiposGasto.length === 0 ? 0.5 : 1}}
              >
                <option value="">Seleccionar tipo...</option>
                {tiposGasto.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} ({tipo.tipo_calculo === 'Comun' ? 'Común' : 'No Común'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Concepto</label>
              <input
                type="text"
                value={nuevoGasto.concepto}
                onChange={(e) => {
                  setNuevoGasto({ ...nuevoGasto, concepto: e.target.value });
                  if (errors.concepto) setErrors({...errors, concepto: ''});
                }}
                placeholder="Nombre del concepto"
                disabled={tiposGasto.length === 0}
                style={{
                  width: '100%', 
                  padding: '8px 12px', 
                  border: `2px solid ${errors.concepto ? '#ef4444' : '#e5e7eb'}`, 
                  borderRadius: '6px', 
                  opacity: tiposGasto.length === 0 ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  backgroundColor: errors.concepto ? '#fef2f2' : 'white'
                }}
              />
              {errors.concepto && (
                <p style={{color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>{errors.concepto}</p>
              )}
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Monto Base</label>
              <input
                type="number"
                value={nuevoGasto.monto}
                onChange={(e) => {
                  setNuevoGasto({ ...nuevoGasto, monto: e.target.value });
                  if (errors.monto) setErrors({...errors, monto: ''});
                }}
                placeholder="0.00"
                disabled={tiposGasto.length === 0}
                style={{
                  width: '100%', 
                  padding: '8px 12px', 
                  border: `2px solid ${errors.monto ? '#ef4444' : '#e5e7eb'}`, 
                  borderRadius: '6px', 
                  opacity: tiposGasto.length === 0 ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  backgroundColor: errors.monto ? '#fef2f2' : 'white'
                }}
              />
              {errors.monto && (
                <p style={{color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>{errors.monto}</p>
              )}
            </div>
          </div>

          {/* Selección de edificios para gastos No Comunes */}
          {nuevoGasto.tipoGastoId && tiposGasto.find(t => t.id == nuevoGasto.tipoGastoId)?.tipo_calculo === 'No_Comun' && (
            <div style={{marginTop: '16px', padding: '16px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px'}}>
              <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#9a3412'}}>Selección de Edificios</h4>
              <p style={{fontSize: '14px', color: '#9a3412', marginBottom: '12px'}}>Este gasto se dividirá en partes iguales entre los apartamentos de los edificios seleccionados</p>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                <input
                  type="checkbox"
                  id="todos-edificios"
                  checked={nuevoGasto.edificiosSeleccionados.length === edificios.length && edificios.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNuevoGasto({ ...nuevoGasto, edificiosSeleccionados: edificios.map(ed => ed.id) });
                    } else {
                      setNuevoGasto({ ...nuevoGasto, edificiosSeleccionados: [] });
                    }
                  }}
                />
                <label htmlFor="todos-edificios" style={{fontSize: '14px', fontWeight: '500'}}>Seleccionar todos los edificios</label>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px'}}>
                {edificios.map((edificio) => (
                  <div key={edificio.id} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px'}}>
                    <input
                      type="checkbox"
                      id={`edificio-${edificio.id}`}
                      checked={nuevoGasto.edificiosSeleccionados.includes(edificio.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNuevoGasto({
                            ...nuevoGasto,
                            edificiosSeleccionados: [...nuevoGasto.edificiosSeleccionados, edificio.id]
                          });
                        } else {
                          setNuevoGasto({
                            ...nuevoGasto,
                            edificiosSeleccionados: nuevoGasto.edificiosSeleccionados.filter(id => id !== edificio.id)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`edificio-${edificio.id}`} style={{fontSize: '14px'}}>
                      {edificio.numero_edificio} - {edificio.descripcion}
                    </label>
                  </div>
                ))}
              </div>
              
              {nuevoGasto.edificiosSeleccionados.length > 0 && (
                <div style={{marginTop: '12px', padding: '8px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '6px'}}>
                  <p style={{fontSize: '12px', color: '#0c4a6e', margin: 0}}>
                    ℹ️ Edificios seleccionados: {nuevoGasto.edificiosSeleccionados.length} | 
                    El monto se dividirá entre los apartamentos de estos edificios
                  </p>
                </div>
              )}
              {errors.edificios && (
                <p style={{color: '#ef4444', fontSize: '12px', marginTop: '8px', animation: 'fadeIn 0.3s ease'}}>{errors.edificios}</p>
              )}
            </div>
          )}

          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px'}}>
            <input
              type="checkbox"
              id="activo-recibo"
              checked={nuevoGasto.activoEnRecibo}
              onChange={(e) => setNuevoGasto({ ...nuevoGasto, activoEnRecibo: e.target.checked })}
              disabled={tiposGasto.length === 0}
            />
            <label htmlFor="activo-recibo" style={{fontSize: '14px', fontWeight: '500'}}>
              {nuevoGasto.activoEnRecibo ? (
                <span style={{color: '#16a34a'}}>✓ Activo en recibo (aparecerá en los recibos generados)</span>
              ) : (
                <span style={{color: '#dc2626'}}>✗ Inactivo en recibo (no aparecerá en los recibos)</span>
              )}
            </label>
          </div>

          <div style={{display: 'flex', gap: '16px', marginTop: '24px'}}>
            <button 
              onClick={handleCreateGasto}
              disabled={!nuevoGasto.concepto.trim() || !nuevoGasto.monto || parseFloat(nuevoGasto.monto) <= 0 || !nuevoGasto.tipoGastoId || isSubmitting || tiposGasto.length === 0}
              className="btn-primary" 
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                opacity: (!nuevoGasto.concepto.trim() || !nuevoGasto.monto || parseFloat(nuevoGasto.monto) <= 0 || !nuevoGasto.tipoGastoId || isSubmitting || tiposGasto.length === 0) ? 0.5 : 1, 
                cursor: (!nuevoGasto.concepto.trim() || !nuevoGasto.monto || parseFloat(nuevoGasto.monto) <= 0 || !nuevoGasto.tipoGastoId || isSubmitting || tiposGasto.length === 0) ? 'not-allowed' : 'pointer',
                transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus style={{width: '16px', height: '16px'}} />
              {isSubmitting ? 'Guardando...' : 'Agregar Gasto'}
            </button>
            <button className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Calendar style={{width: '16px', height: '16px'}} />
              Crear Movimientos Recurrentes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'movimientos' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
          {/* Formulario para crear movimiento */}
          <div className="card">
            <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Nuevo Movimiento de Gasto</h3>
            <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '16px'}}>Registra un gasto real ejecutado basado en una plantilla existente</p>
            
            {gastosMes.length === 0 && (
              <div style={{padding: '20px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', marginBottom: '16px'}}>
                <p style={{color: '#92400e', margin: 0}}>⚠️ Primero debes crear plantillas de gastos en la pestaña "Gastos del Mes"</p>
              </div>
            )}
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Plantilla de Gasto</label>
                <select
                  value={nuevoMovimiento.id_gasto_mes}
                  onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, id_gasto_mes: e.target.value })}
                  disabled={gastosMes.length === 0}
                  style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', opacity: gastosMes.length === 0 ? 0.5 : 1}}
                >
                  <option value="">Seleccionar plantilla...</option>
                  {gastosMes.map((gasto) => (
                    <option key={gasto.id} value={gasto.id}>
                      {gasto.id_concepto?.descripcion || 'Concepto'} - ${parseFloat(gasto.monto_base || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Monto Real</label>
                <input
                  type="number"
                  value={nuevoMovimiento.monto_real}
                  onChange={(e) => {
                    setNuevoMovimiento({ ...nuevoMovimiento, monto_real: e.target.value });
                    if (errors.monto_real) setErrors({...errors, monto_real: ''});
                  }}
                  placeholder="0.00"
                  disabled={gastosMes.length === 0}
                  style={{
                    width: '100%', 
                    padding: '8px 12px', 
                    border: `2px solid ${errors.monto_real ? '#ef4444' : '#e5e7eb'}`, 
                    borderRadius: '6px', 
                    opacity: gastosMes.length === 0 ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    backgroundColor: errors.monto_real ? '#fef2f2' : 'white'
                  }}
                />
                {errors.monto_real && (
                  <p style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', animation: 'fadeIn 0.3s ease'}}>{errors.monto_real}</p>
                )}
              </div>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Fecha del Gasto</label>
                <input
                  type="date"
                  value={nuevoMovimiento.fecha_gasto}
                  onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fecha_gasto: e.target.value })}
                  disabled={gastosMes.length === 0}
                  style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', opacity: gastosMes.length === 0 ? 0.5 : 1}}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Mes de Aplicación</label>
                <input
                  type="month"
                  value={nuevoMovimiento.mes_aplicacion.slice(0, 7)}
                  onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, mes_aplicacion: e.target.value + '-01' })}
                  disabled={gastosMes.length === 0}
                  style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', opacity: gastosMes.length === 0 ? 0.5 : 1}}
                />
              </div>
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Descripción Adicional (Opcional)</label>
              <textarea
                value={nuevoMovimiento.descripcion_adicional}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, descripcion_adicional: e.target.value })}
                placeholder="Detalles adicionales del gasto..."
                rows={3}
                disabled={gastosMes.length === 0}
                style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', resize: 'vertical', opacity: gastosMes.length === 0 ? 0.5 : 1}}
              />
            </div>
            
            <button 
              onClick={handleCreateMovimiento}
              disabled={!nuevoMovimiento.id_gasto_mes || !nuevoMovimiento.monto_real || parseFloat(nuevoMovimiento.monto_real) <= 0 || !nuevoMovimiento.fecha_gasto || isSubmitting || gastosMes.length === 0}
              className="btn-primary" 
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                opacity: (!nuevoMovimiento.id_gasto_mes || !nuevoMovimiento.monto_real || parseFloat(nuevoMovimiento.monto_real) <= 0 || !nuevoMovimiento.fecha_gasto || isSubmitting || gastosMes.length === 0) ? 0.5 : 1, 
                cursor: (!nuevoMovimiento.id_gasto_mes || !nuevoMovimiento.monto_real || parseFloat(nuevoMovimiento.monto_real) <= 0 || !nuevoMovimiento.fecha_gasto || isSubmitting || gastosMes.length === 0) ? 'not-allowed' : 'pointer',
                transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus style={{width: '16px', height: '16px'}} />
              {isSubmitting ? 'Guardando...' : 'Registrar Movimiento'}
            </button>
          </div>
          
          {/* Lista de movimientos */}
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <div>
                <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '4px'}}>Movimientos Registrados</h3>
                <p style={{color: '#6b7280', fontSize: '14px', margin: 0}}>Historial de gastos reales ejecutados</p>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <label style={{fontSize: '14px', fontWeight: '500', color: '#374151'}}>Filtrar por mes:</label>
                <input
                  type="month"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  style={{padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px'}}
                />
                {filtroFecha && (
                  <button
                    onClick={() => setFiltroFecha('')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>
            
            {!filtroFecha && (
              <div style={{padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '6px', marginBottom: '16px'}}>
                <p style={{fontSize: '14px', color: '#0c4a6e', margin: 0}}>
                  ℹ️ Mostrando movimientos del mes anterior ({getMesAnterior()}) hacia atrás. Usa el filtro para ver un mes específico.
                </p>
              </div>
            )}
            
            {movimientosFiltrados.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {movimientosFiltrados.map((movimiento) => (
                  <div key={movimiento.id} style={{padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <h4 style={{fontWeight: '500', margin: 0}}>{movimiento.id_gasto_mes?.id_concepto?.descripcion || 'Movimiento'}</h4>
                        <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>Fecha: {new Date(movimiento.fecha_gasto).toLocaleDateString()}</p>
                        {movimiento.descripcion_adicional && (
                          <p style={{fontSize: '12px', color: '#6b7280', margin: 0}}>{movimiento.descripcion_adicional}</p>
                        )}
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <p style={{fontSize: '16px', fontWeight: '600', margin: 0}}>${parseFloat(movimiento.monto_real || 0).toLocaleString()}</p>
                        <p style={{fontSize: '12px', color: '#6b7280', margin: 0}}>Mes: {new Date(movimiento.mes_aplicacion).toLocaleDateString('es', {month: 'long', year: 'numeric'})}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
                <Building2 style={{width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5}} />
                <p>{filtroFecha ? `No hay movimientos para ${filtroFecha}` : 'No hay movimientos del mes anterior hacia atrás'}</p>
                <p style={{fontSize: '14px'}}>{filtroFecha ? 'Selecciona otro mes o limpia el filtro' : 'Crea tu primer movimiento usando el formulario de arriba'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}