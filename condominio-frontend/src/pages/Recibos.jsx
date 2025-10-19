import { useState, useEffect } from 'react'
import { condominioService } from '../services/condominioService'
import { Receipt, Download, Eye, Filter, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Send, Plus } from 'lucide-react'

export default function Recibos() {
  const [recibos, setRecibos] = useState([])
  const [inmuebles, setInmuebles] = useState([])
  const [edificios, setEdificios] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedEdificio, setSelectedEdificio] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [numeroRecibo, setNumeroRecibo] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [selectedRecibo, setSelectedRecibo] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterMonth) params.append('mes', filterMonth)
      if (numeroRecibo) params.append('numero_recibo', numeroRecibo)
      
      const [recibosData, inmueblesData, edificiosData] = await Promise.all([
        condominioService.getRecibos(params.toString()),
        condominioService.getInmuebles(),
        condominioService.getEdificios()
      ])
      setRecibos(recibosData?.results || recibosData || [])
      setInmuebles(inmueblesData?.results || inmueblesData || [])
      setEdificios(edificiosData?.results || edificiosData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAll = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const mesAplicacion = selectedMonth + '-01'
      const response = await condominioService.generarRecibos(mesAplicacion)
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      
      alert(`${response.message || 'Recibos generados exitosamente'}`)
      loadData() // Reload data after generation
    } catch (error) {
      console.error('Error generando recibos:', error)
      alert('Error al generar recibos')
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 1000)
    }
  }

  const handleUpdateRecibos = async () => {
    if (!confirm('¿Estás seguro? Esto eliminará los recibos existentes del mes y los regenerará con los conceptos actuales.')) {
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const mesAplicacion = selectedMonth + '-01'
      const response = await condominioService.actualizarRecibos(mesAplicacion)
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      
      alert(`${response.message || 'Recibos actualizados exitosamente'}`)
      // Force reload with fresh data
      window.location.reload()
    } catch (error) {
      console.error('Error actualizando recibos:', error)
      alert('Error al actualizar recibos')
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 1000)
    }
  }

  const getEstadoBadge = (recibo) => {
    const estado = recibo.estado || (recibo.saldo_pendiente === 0 ? 'Pagado' : 'Pendiente')
    if (estado === 'Pagado') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          backgroundColor: '#dcfce7',
          color: '#166534',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          <CheckCircle style={{width: '12px', height: '12px'}} />
          {estado}
        </span>
      )
    } else {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          backgroundColor: '#fecaca',
          color: '#991b1b',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          <AlertTriangle style={{width: '12px', height: '12px'}} />
          {estado}
        </span>
      )
    }
  }

  const filteredRecibos = recibos.filter((recibo) => {
    const matchesEdificio = !selectedEdificio || recibo.id_inmueble?.edificio?.id === parseInt(selectedEdificio)
    const estado = recibo.estado || (recibo.saldo_pendiente === 0 ? 'Pagado' : 'Pendiente')
    const matchesEstado = !selectedEstado || 
      (selectedEstado === 'pagado' && estado === 'Pagado') ||
      (selectedEstado === 'pendiente' && estado === 'Pendiente')
    return matchesEdificio && matchesEstado
  })

  const totalGenerado = filteredRecibos.reduce((sum, recibo) => sum + parseFloat(recibo.monto_total_pagar || 0), 0)
  const totalCobrado = filteredRecibos
    .filter((r) => (r.estado || (r.saldo_pendiente === 0 ? 'Pagado' : 'Pendiente')) === 'Pagado')
    .reduce((sum, recibo) => sum + parseFloat(recibo.monto_total_pagar || 0), 0)
  const pendienteCobrar = totalGenerado - totalCobrado

  if (loading) {
    return <div style={{padding: '24px', textAlign: 'center'}}>Cargando recibos...</div>
  }

  return (
    <div style={{padding: '0'}}>
      {/* Header */}
      <div style={{marginBottom: '24px'}}>
        <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px'}}>Gestión de Recibos</h1>
        <p style={{color: '#6b7280', fontSize: '16px'}}>Genera y administra los recibos mensuales del condominio</p>
      </div>

      {/* Controls */}
      <div className="card" style={{marginBottom: '24px'}}>
        <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Calendar style={{width: '20px', height: '20px'}} />
          Controles de Generación
        </h3>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '500'}}>Mes/Año:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', width: '160px'}}
            />
          </div>
          <button 
            onClick={handleGenerateAll} 
            disabled={isGenerating}
            className="btn-primary"
            style={{display: 'flex', alignItems: 'center', gap: '8px'}}
          >
            <Receipt style={{width: '16px', height: '16px'}} />
            {isGenerating ? 'Generando...' : 'Generar Todos los Recibos'}
          </button>
          <button 
            onClick={handleUpdateRecibos} 
            disabled={isGenerating}
            className="btn-secondary"
            style={{display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f59e0b', color: 'white', borderColor: '#f59e0b'}}
          >
            <Receipt style={{width: '16px', height: '16px'}} />
            {isGenerating ? 'Actualizando...' : 'Actualizar Recibos del Mes'}
          </button>
          <button 
            className="btn-secondary"
            style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c', borderColor: '#fed7aa'}}
          >
            <Send style={{width: '16px', height: '16px'}} />
            Enviar Recordatorios
          </button>
        </div>

        {isGenerating && (
          <div style={{marginTop: '16px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px'}}>
              <span>Generando recibos...</span>
              <span>{generationProgress}%</span>
            </div>
            <div style={{width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden'}}>
              <div 
                style={{
                  width: `${generationProgress}%`, 
                  height: '100%', 
                  backgroundColor: '#2563eb', 
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px'}}>
        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', color: '#374151'}}>Total Generado</h3>
            <DollarSign style={{width: '16px', height: '16px', color: '#6b7280'}} />
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#111827'}}>${totalGenerado.toLocaleString()}</div>
          <p style={{fontSize: '12px', color: '#6b7280'}}>{filteredRecibos.length} recibos generados</p>
        </div>

        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', color: '#374151'}}>Total Cobrado</h3>
            <CheckCircle style={{width: '16px', height: '16px', color: '#16a34a'}} />
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#16a34a'}}>${totalCobrado.toLocaleString()}</div>
          <p style={{fontSize: '12px', color: '#6b7280'}}>
            {filteredRecibos.filter((r) => (r.estado || (r.saldo_pendiente === 0 ? 'Pagado' : 'Pendiente')) === 'Pagado').length} recibos pagados
          </p>
        </div>

        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', color: '#374151'}}>Pendiente por Cobrar</h3>
            <AlertTriangle style={{width: '16px', height: '16px', color: '#dc2626'}} />
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#dc2626'}}>${pendienteCobrar.toLocaleString()}</div>
          <p style={{fontSize: '12px', color: '#6b7280'}}>
            {filteredRecibos.filter((r) => (r.estado || (r.saldo_pendiente === 0 ? 'Pagado' : 'Pendiente')) === 'Pendiente').length} recibos pendientes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom: '24px'}}>
        <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Filter style={{width: '20px', height: '20px'}} />
          Filtros
        </h3>
        
        <div style={{display: 'flex', gap: '16px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '500'}}>Edificio:</label>
            <select 
              value={selectedEdificio} 
              onChange={(e) => setSelectedEdificio(e.target.value)}
              style={{padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', width: '160px'}}
            >
              <option value="">Todos</option>
              {edificios.map((edificio) => (
                <option key={edificio.id} value={edificio.id}>
                  Edificio {edificio.numero_edificio}
                </option>
              ))}
            </select>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '500'}}>Estado:</label>
            <select 
              value={selectedEstado} 
              onChange={(e) => setSelectedEstado(e.target.value)}
              style={{padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', width: '160px'}}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '500'}}>Filtrar por Mes:</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', width: '160px'}}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '500'}}>Número Recibo:</label>
            <input
              type="text"
              placeholder="202511-0001"
              value={numeroRecibo}
              onChange={(e) => setNumeroRecibo(e.target.value)}
              style={{padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', width: '160px'}}
            />
          </div>
          <button 
            onClick={loadData}
            className="btn-secondary"
            style={{padding: '8px 16px'}}
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Recibos Table */}
      <div className="card" style={{padding: '0', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb'}}>
              <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Número</th>
              <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Inmueble</th>
              <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Propietario</th>
              <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Monto Total</th>
              <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Saldo Pendiente</th>
              <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Estado</th>
              <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Fecha Emisión</th>
              <th style={{padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecibos.length === 0 ? (
              <tr>
                <td colSpan="8" style={{padding: '40px', textAlign: 'center', color: '#6b7280'}}>
                  <Receipt style={{width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5}} />
                  <p>No hay recibos generados</p>
                  <p style={{fontSize: '14px'}}>Genera recibos usando el botón de arriba</p>
                </td>
              </tr>
            ) : (
              filteredRecibos.map((recibo) => (
                <tr key={recibo.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                  <td style={{padding: '12px', fontWeight: '600', color: '#2563eb'}}>
                    {recibo.numero_recibo || `R-${recibo.id}`}
                  </td>
                  <td style={{padding: '12px', fontWeight: '500'}}>
                    {recibo.id_inmueble ? 
                      `${recibo.id_inmueble.edificio?.numero_edificio}-${recibo.id_inmueble.piso}-${recibo.id_inmueble.apartamento}` 
                      : 'N/A'
                    }
                  </td>
                  <td style={{padding: '12px'}}>
                    {recibo.id_inmueble?.propietario ? 
                      `${recibo.id_inmueble.propietario.nombre} ${recibo.id_inmueble.propietario.apellido}` 
                      : 'N/A'
                    }
                  </td>
                  <td style={{padding: '12px', fontWeight: '600'}}>${parseFloat(recibo.monto_total_pagar || 0).toLocaleString()}</td>
                  <td style={{padding: '12px', fontWeight: '600', color: recibo.saldo_pendiente > 0 ? '#dc2626' : '#16a34a'}}>
                    ${parseFloat(recibo.saldo_pendiente || 0).toLocaleString()}
                  </td>
                  <td style={{padding: '12px'}}>{getEstadoBadge(recibo)}</td>
                  <td style={{padding: '12px'}}>{new Date(recibo.fecha_emision).toLocaleDateString()}</td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                      <button 
                        onClick={() => {
                          setSelectedRecibo(recibo)
                          setShowModal(true)
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye style={{width: '14px', height: '14px'}} />
                        Ver
                      </button>
                      <button 
                        onClick={() => condominioService.descargarReciboPDF(recibo.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download style={{width: '14px', height: '14px'}} />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para ver detalles del recibo */}
      {showModal && selectedRecibo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{width: '500px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{fontSize: '18px', fontWeight: '600', margin: 0}}>Detalle del Recibo #{selectedRecibo.id}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <p><strong>Inmueble:</strong> {selectedRecibo.id_inmueble ? 
                `${selectedRecibo.id_inmueble.edificio?.numero_edificio}-${selectedRecibo.id_inmueble.piso}-${selectedRecibo.id_inmueble.apartamento}` 
                : 'N/A'}</p>
              <p><strong>Propietario:</strong> {selectedRecibo.id_inmueble?.propietario ? 
                `${selectedRecibo.id_inmueble.propietario.nombre} ${selectedRecibo.id_inmueble.propietario.apellido}` 
                : 'N/A'}</p>
              <p><strong>Fecha de Emisión:</strong> {new Date(selectedRecibo.fecha_emision).toLocaleDateString()}</p>
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px'}}>Desglose de Montos</h4>
              <div style={{backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                  <span>Deuda Anterior:</span>
                  <span>${parseFloat(selectedRecibo.monto_deuda_anterior || 0).toLocaleString()}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                  <span>Cargos del Mes:</span>
                  <span>${parseFloat(selectedRecibo.monto_cargos_mes || 0).toLocaleString()}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span>Interés de Mora:</span>
                  <span>${parseFloat(selectedRecibo.monto_interes_mora || 0).toLocaleString()}</span>
                </div>
                <hr style={{margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '16px'}}>
                  <span>Total a Pagar:</span>
                  <span>${parseFloat(selectedRecibo.monto_total_pagar || 0).toLocaleString()}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '16px', color: selectedRecibo.saldo_pendiente > 0 ? '#dc2626' : '#16a34a'}}>
                  <span>Saldo Pendiente:</span>
                  <span>${parseFloat(selectedRecibo.saldo_pendiente || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: '#333' }}>Detalles del Recibo:</h4>
              {selectedRecibo.detalles && selectedRecibo.detalles.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {/* Gastos Comunes */}
                  {selectedRecibo.detalles.filter(d => d.tipo_gasto === 'Comun').length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ 
                        color: '#007bff', 
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px'
                      }}>Gastos Comunes (Por Alícuota)</h5>
                      {selectedRecibo.detalles
                        .filter(d => d.tipo_gasto === 'Comun')
                        .map((detalle, index) => (
                        <div key={`comun-${index}`} style={{
                          padding: '8px 12px',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                          borderLeft: '3px solid #007bff',
                          marginBottom: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500' }}>{detalle.descripcion_gasto}</span>
                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                              ${parseFloat(detalle.monto_calculado).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Gastos No Comunes */}
                  {selectedRecibo.detalles.filter(d => d.tipo_gasto === 'No_Comun').length > 0 && (
                    <div>
                      <h5 style={{ 
                        color: '#ff6b35', 
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#fff3e0',
                        borderRadius: '4px'
                      }}>Gastos No Comunes (Partes Iguales)</h5>
                      {selectedRecibo.detalles
                        .filter(d => d.tipo_gasto === 'No_Comun')
                        .map((detalle, index) => (
                        <div key={`no-comun-${index}`} style={{
                          padding: '8px 12px',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                          borderLeft: '3px solid #ff6b35',
                          marginBottom: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500' }}>{detalle.descripcion_gasto}</span>
                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                              ${parseFloat(detalle.monto_calculado).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No hay detalles disponibles</p>
              )}
            </div>
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px'}}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cerrar
              </button>
              <button 
                onClick={() => condominioService.descargarReciboPDF(selectedRecibo.id)}
                className="btn-primary" 
                style={{display: 'flex', alignItems: 'center', gap: '8px'}}
              >
                <Download style={{width: '16px', height: '16px'}} />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}