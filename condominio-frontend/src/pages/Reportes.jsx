import { useState, useEffect } from 'react'
import { condominioService } from '../services/condominioService'

export default function Reportes() {
  const [morosos, setMorosos] = useState([])
  const [flujoCaja, setFlujoCaja] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReportes()
  }, [])

  const loadReportes = async () => {
    try {
      const [morososData, flujoData] = await Promise.all([
        condominioService.getMorosos(),
        condominioService.getFlujoCaja(2025)
      ])
      setMorosos(morososData.results || morososData)
      setFlujoCaja(flujoData.results || flujoData)
    } catch (error) {
      console.error('Error loading reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Cargando reportes...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Reportes del condominio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reporte de Morosos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Propietarios Morosos</h2>
            {morosos.length === 0 ? (
              <p className="text-gray-500">No hay morosos registrados</p>
            ) : (
              <div className="space-y-2">
                {morosos.map((moroso, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">{moroso.propietario}</p>
                      <p className="text-sm text-gray-600">{moroso.inmueble}</p>
                    </div>
                    <span className="font-bold text-red-600">${moroso.saldo_pendiente}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flujo de Caja */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-600">Flujo de Caja 2025</h2>
            {flujoCaja.length === 0 ? (
              <p className="text-gray-500">No hay datos de flujo de caja</p>
            ) : (
              <div className="space-y-2">
                {flujoCaja.map((mes, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">{new Date(mes.mes).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                    <span className="font-bold text-green-600">${mes.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}