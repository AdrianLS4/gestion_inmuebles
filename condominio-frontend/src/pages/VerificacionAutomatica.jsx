import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Clock, Play, RefreshCw, AlertTriangle } from "lucide-react"
import { condominioService } from "@/services/condominioService"

export default function VerificacionAutomatica() {
  const [configuracion, setConfiguracion] = useState(null)
  const [ultimosRecibos, setUltimosRecibos] = useState([])
  const [estadoSistema, setEstadoSistema] = useState({
    configuracion_activa: false,
    recibos_mes_actual: 0,
    ultimo_recibo_generado: null,
    proxima_generacion: null
  })
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [config, recibos] = await Promise.all([
        condominioService.getConfiguracionRecibos(),
        condominioService.getRecibos()
      ])
      
      setConfiguracion(config[0] || null)
      setUltimosRecibos(recibos?.results?.slice(0, 10) || [])
      
      // Calcular estado del sistema
      const hoy = new Date()
      const mesActual = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}`
      const recibosEsteMes = recibos?.results?.filter(r => 
        r.fecha_emision.startsWith(mesActual)
      ) || []
      
      setEstadoSistema({
        configuracion_activa: config[0]?.activo || false,
        recibos_mes_actual: recibosEsteMes.length,
        ultimo_recibo_generado: recibos?.results?.[0]?.fecha_emision || null,
        proxima_generacion: calcularProximaGeneracion(config[0])
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularProximaGeneracion = (config) => {
    if (!config) return null
    
    const hoy = new Date()
    const proximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, config.dia_generacion)
    
    return proximoMes.toLocaleDateString()
  }

  const ejecutarPruebaAutomatica = async () => {
    setLoading(true)
    setTestResults(null)
    
    try {
      // Simular generación de recibos
      const response = await condominioService.generarRecibos()
      
      setTestResults({
        success: true,
        message: response.message || 'Prueba ejecutada exitosamente',
        recibos_generados: response.recibos_generados || 0,
        fecha_ejecucion: new Date().toLocaleString()
      })
      
      // Recargar datos
      await cargarDatos()
    } catch (error) {
      setTestResults({
        success: false,
        message: error.response?.data?.error || error.message,
        fecha_ejecucion: new Date().toLocaleString()
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !configuracion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando verificación...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificación del Sistema Automático</h1>
        <p className="text-muted-foreground mt-1">Monitorea el funcionamiento de la generación automática de recibos</p>
      </div>

      {/* Estado General del Sistema */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado Sistema</CardTitle>
            {estadoSistema.configuracion_activa ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={estadoSistema.configuracion_activa ? "default" : "destructive"}>
                {estadoSistema.configuracion_activa ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Configuración automática</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibos Este Mes</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadoSistema.recibos_mes_actual}</div>
            <p className="text-xs text-muted-foreground">Generados automáticamente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Recibo</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {estadoSistema.ultimo_recibo_generado ? 
                new Date(estadoSistema.ultimo_recibo_generado).toLocaleDateString() : 
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">Fecha de generación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Generación</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {estadoSistema.proxima_generacion || 'No configurada'}
            </div>
            <p className="text-xs text-muted-foreground">Fecha programada</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuración Actual */}
      {configuracion && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración Actual</CardTitle>
            <CardDescription>Parámetros del sistema automático</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">Generación de Recibos</h4>
                <p className="text-sm text-muted-foreground">
                  Día: {configuracion.dia_generacion} de cada mes
                </p>
                <p className="text-sm text-muted-foreground">
                  Hora: {configuracion.hora_generacion}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Recordatorios</h4>
                <p className="text-sm text-muted-foreground">
                  Día: {configuracion.dia_recordatorio} de cada mes
                </p>
                <p className="text-sm text-muted-foreground">
                  Hora: {configuracion.hora_recordatorio}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prueba Manual */}
      <Card>
        <CardHeader>
          <CardTitle>Prueba Manual del Sistema</CardTitle>
          <CardDescription>Ejecuta una prueba para verificar el funcionamiento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={ejecutarPruebaAutomatica}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {loading ? 'Ejecutando...' : 'Ejecutar Prueba'}
            </Button>
            
            {testResults && (
              <div className={`p-4 rounded-lg border ${
                testResults.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResults.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {testResults.success ? 'Prueba Exitosa' : 'Prueba Fallida'}
                  </span>
                </div>
                <p className="text-sm mb-1">{testResults.message}</p>
                {testResults.recibos_generados && (
                  <p className="text-sm">Recibos generados: {testResults.recibos_generados}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ejecutado: {testResults.fecha_ejecucion}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Últimos Recibos Generados */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Recibos Generados</CardTitle>
          <CardDescription>Historial de recibos creados automáticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Inmueble</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ultimosRecibos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay recibos generados
                  </TableCell>
                </TableRow>
              ) : (
                ultimosRecibos.map((recibo) => (
                  <TableRow key={recibo.id}>
                    <TableCell className="font-mono">{recibo.numero_recibo}</TableCell>
                    <TableCell>{new Date(recibo.fecha_emision).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {recibo.id_inmueble?.edificio?.numero_edificio}-
                      {recibo.id_inmueble?.piso}{recibo.id_inmueble?.apartamento}
                    </TableCell>
                    <TableCell className="font-bold">
                      ${parseFloat(recibo.monto_total_pagar).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={recibo.estado === 'Pagado' ? 'default' : 'destructive'}>
                        {recibo.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}