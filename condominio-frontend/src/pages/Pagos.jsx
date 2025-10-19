import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Removed Dialog imports - using custom modals
import { Search, Filter, Eye, Upload, FileText, AlertTriangle, History } from "lucide-react"
import { condominioService } from "@/services/condominioService"

export default function PagosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [morosos, setMorosos] = useState([])
  const [pagosVerificadosHoy, setPagosVerificadosHoy] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMoroso, setSelectedMoroso] = useState(null)
  const [recibosDialogOpen, setRecibosDialogOpen] = useState(false)
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false)
  const [selectedRecibo, setSelectedRecibo] = useState(null)
  const [comprobante, setComprobante] = useState(null)
  const [comprobantePreview, setComprobantePreview] = useState(null)
  const [montoPagado, setMontoPagado] = useState("")
  const [referenciaBancaria, setReferenciaBancaria] = useState("")
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false)
  const [historialPagos, setHistorialPagos] = useState([])
  const [creditosPropietarios, setCreditosPropietarios] = useState([])
  const [activeTab, setActiveTab] = useState('morosos')
  const [historialGeneral, setHistorialGeneral] = useState([])
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroMontoMin, setFiltroMontoMin] = useState('')
  const [filtroMontoMax, setFiltroMontoMax] = useState('')
  const [filtroReferencia, setFiltroReferencia] = useState('')
  const [filtroPropietario, setFiltroPropietario] = useState('')


  useEffect(() => {
    cargarDatos()
  }, [])
  
  useEffect(() => {
    if (activeTab === 'historial') {
      cargarHistorialGeneral()
    }
  }, [activeTab])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [morososList, verificados, creditos] = await Promise.all([
        condominioService.getMorosos(),
        condominioService.getPagos({ estado: 'Verificado', fecha: new Date().toISOString().split('T')[0] }),
        condominioService.getCreditosPropietarios()
      ])
      setMorosos(morososList || [])
      setPagosVerificadosHoy(verificados?.results || [])
      setCreditosPropietarios(creditos || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
      setMorosos([])
      setPagosVerificadosHoy([])
      setCreditosPropietarios([])
    } finally {
      setLoading(false)
    }
  }
  
  const cargarHistorialGeneral = async () => {
    try {
      const pagos = await condominioService.getPagos({ estado: 'Verificado' })
      const pagosArray = pagos?.results || []
      
      const historialData = pagosArray.map(pago => ({
        id: pago.id,
        fecha: pago.fecha_pago,
        inmueble: pago.inmueble || `${pago.id_recibo?.id_inmueble?.edificio?.numero_edificio || ''}-${pago.id_recibo?.id_inmueble?.piso || ''}${pago.id_recibo?.id_inmueble?.apartamento || ''}`,
        propietario: pago.propietario || `${pago.id_recibo?.id_inmueble?.propietario?.nombre || ''} ${pago.id_recibo?.id_inmueble?.propietario?.apellido || ''}`,
        monto_pagado: pago.monto_pagado,
        recibo_numero: pago.id_recibo?.numero_recibo,
        referencia_bancaria: pago.referencia_bancaria,
        saldo_restante: pago.id_recibo?.saldo_pendiente || 0,
        pago_completo: (pago.id_recibo?.saldo_pendiente || 0) === 0
      }))
      
      setHistorialGeneral(historialData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
    } catch (error) {
      console.error('Error cargando historial general:', error)
      setHistorialGeneral([])
    }
  }

  const handleVerRecibos = async (moroso) => {
    try {
      const params = new URLSearchParams({
        inmueble: moroso.inmueble_id
      })
      const recibos = await condominioService.getRecibos(params.toString())
      const morosoConRecibos = { ...moroso, recibos: recibos?.results || [] }
      setSelectedMoroso(morosoConRecibos)
      setRecibosDialogOpen(true)
    } catch (error) {
      console.error('Error cargando recibos:', error)
      alert('Error al cargar los recibos')
    }
  }

  const handleVerHistorial = async (propietarioId) => {
    try {
      const historial = await condominioService.getHistorialPagos(propietarioId)
      setHistorialPagos(historial || [])
      setHistorialDialogOpen(true)
    } catch (error) {
      console.error('Error cargando historial:', error)
      alert('Error al cargar el historial de pagos')
    }
  }

  const handleRegistrarPago = (recibo) => {
    setSelectedRecibo(recibo)
    setMontoPagado(recibo.saldo_pendiente.toString())
    setReferenciaBancaria('')
    setComprobante(null)
    setComprobantePreview(null)
    setPagoDialogOpen(true)
  }

  const handleConfirmarPago = async () => {
    if (!montoPagado || !referenciaBancaria) {
      alert('Monto y referencia bancaria son requeridos')
      return
    }

    try {
      const response = await condominioService.registrarPago(selectedRecibo.id, {
        monto_pagado: montoPagado,
        referencia_bancaria: referenciaBancaria
      })
      
      setPagoDialogOpen(false)
      setSelectedRecibo(null)
      setMontoPagado('')
      setReferenciaBancaria('')
      setComprobante(null)
      setComprobantePreview(null)
      
      // Reload data and refresh receipts modal
      await cargarDatos()
      
      // Refresh receipts in the modal
      if (selectedMoroso) {
        const params = new URLSearchParams({
          inmueble: selectedMoroso.inmueble_id
        })
        const recibos = await condominioService.getRecibos(params.toString())
        const morosoActualizado = { ...selectedMoroso, recibos: recibos?.results || [] }
        setSelectedMoroso(morosoActualizado)
      }
      
      // Mostrar detalles del pago procesado
      let mensaje = 'Pago registrado exitosamente\n'
      if (response.pagos_aplicados && response.pagos_aplicados.length > 0) {
        mensaje += '\nPagos aplicados:\n'
        response.pagos_aplicados.forEach(pago => {
          mensaje += `- Recibo ${pago.recibo}: $${pago.monto_aplicado}\n`
        })
      }
      if (response.credito_restante > 0) {
        mensaje += `\nCrédito generado: $${response.credito_restante}`
      }
      alert(mensaje)
    } catch (error) {
      console.error('Error registrando pago:', error)
      alert('Error al registrar el pago: ' + (error.response?.data?.error || error.message))
    }
  }

  const filteredMorosos = morosos.filter((moroso) => {
    return (moroso.propietario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (moroso.inmueble || '').toLowerCase().includes(searchTerm.toLowerCase())
  })

  const calcularMorosidad = (fechaEmision) => {
    const hoy = new Date()
    const emision = new Date(fechaEmision)
    const diffTime = Math.abs(hoy - emision)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const totalDeuda = morosos.reduce((sum, m) => sum + parseFloat(m.saldo_pendiente || 0), 0)
  const totalVerificadoHoy = pagosVerificadosHoy.reduce((sum, p) => sum + parseFloat(p.monto_pagado || 0), 0)
  const totalMorosos = morosos.filter(m => m.es_moroso).length
  const totalCreditos = creditosPropietarios.reduce((sum, c) => sum + parseFloat(c.saldo_credito || 0), 0)
  
  const historialFiltrado = historialGeneral.filter((pago) => {
    const fechaPago = new Date(pago.fecha)
    const montoPago = parseFloat(pago.monto_pagado)
    
    // Filtro por fecha desde
    if (filtroFechaDesde && fechaPago < new Date(filtroFechaDesde)) return false
    
    // Filtro por fecha hasta
    if (filtroFechaHasta && fechaPago > new Date(filtroFechaHasta)) return false
    
    // Filtro por monto mínimo
    if (filtroMontoMin && montoPago < parseFloat(filtroMontoMin)) return false
    
    // Filtro por monto máximo
    if (filtroMontoMax && montoPago > parseFloat(filtroMontoMax)) return false
    
    // Filtro por referencia
    if (filtroReferencia && !pago.referencia_bancaria?.toLowerCase().includes(filtroReferencia.toLowerCase())) return false
    
    // Filtro por propietario
    if (filtroPropietario && !pago.propietario?.toLowerCase().includes(filtroPropietario.toLowerCase())) return false
    
    return true
  })
  
  const limpiarFiltrosHistorial = () => {
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setFiltroMontoMin('')
    setFiltroMontoMax('')
    setFiltroReferencia('')
    setFiltroPropietario('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando pagos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground mt-1">Gestiona los pagos y recibos pendientes de los propietarios</p>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('morosos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'morosos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="inline-block w-4 h-4 mr-2" />
              Morosos
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'historial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="inline-block w-4 h-4 mr-2" />
              Historial
            </button>
          </nav>
        </div>

        {activeTab === 'morosos' && creditosPropietarios.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg text-blue-600">Créditos Disponibles</CardTitle>
              <CardDescription>Propietarios con saldo a favor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {creditosPropietarios.map((credito, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="font-medium">{credito.propietario}</span>
                    <span className="font-bold text-blue-600">${parseFloat(credito.saldo_credito).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'morosos' && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deuda</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${parseFloat(totalDeuda || 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{totalMorosos} propietarios morosos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Hoy</CardTitle>
                <Eye className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalVerificadoHoy.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{pagosVerificadosHoy.length} pagos recibidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Morosos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMorosos}</div>
                <p className="text-xs text-muted-foreground">Propietarios con deuda</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'morosos' && (
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Propietario, inmueble..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSearchTerm("")}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'morosos' && (
          <Card>
            <CardHeader>
              <CardTitle>Propietarios con Deuda</CardTitle>
              <CardDescription>Lista de propietarios con recibos pendientes de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Inmueble</TableHead>
                    <TableHead>Deuda Total</TableHead>
                    <TableHead>Recibos Pendientes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMorosos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay propietarios con deuda
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMorosos.map((moroso, index) => {
                      const diasMorosidad = calcularMorosidad(moroso.fecha_emision || new Date())
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{moroso.propietario}</TableCell>
                          <TableCell>{moroso.inmueble}</TableCell>
                          <TableCell className="font-bold text-red-600">
                            ${parseFloat(moroso.saldo_pendiente || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={moroso.recibos_pendientes > 3 ? "destructive" : "secondary"}>
                              {moroso.recibos_pendientes} recibos
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={moroso.es_moroso ? "destructive" : "secondary"}>
                              {moroso.es_moroso ? 'Moroso' : 'Al día'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerRecibos(moroso)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Recibos
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerHistorial(moroso.propietario_id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Historial
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'historial' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Historial</CardTitle>
                <CardDescription>Filtra los pagos por fecha, monto, referencia o propietario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-desde">Fecha Desde</Label>
                    <Input
                      id="fecha-desde"
                      type="date"
                      value={filtroFechaDesde}
                      onChange={(e) => setFiltroFechaDesde(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-hasta">Fecha Hasta</Label>
                    <Input
                      id="fecha-hasta"
                      type="date"
                      value={filtroFechaHasta}
                      onChange={(e) => setFiltroFechaHasta(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto-min">Monto Mín.</Label>
                    <Input
                      id="monto-min"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={filtroMontoMin}
                      onChange={(e) => setFiltroMontoMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto-max">Monto Máx.</Label>
                    <Input
                      id="monto-max"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={filtroMontoMax}
                      onChange={(e) => setFiltroMontoMax(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referencia</Label>
                    <Input
                      id="referencia"
                      placeholder="REF-2025-001"
                      value={filtroReferencia}
                      onChange={(e) => setFiltroReferencia(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propietario-hist">Propietario</Label>
                    <Input
                      id="propietario-hist"
                      placeholder="Nombre..."
                      value={filtroPropietario}
                      onChange={(e) => setFiltroPropietario(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={limpiarFiltrosHistorial}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                  <div className="text-sm text-muted-foreground flex items-center">
                    Mostrando {historialFiltrado.length} de {historialGeneral.length} pagos
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Registro completo de todos los pagos realizados</CardDescription>
              </CardHeader>
              <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Inmueble</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Monto Pagado</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    <TableHead>Recibo</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialFiltrado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {historialGeneral.length === 0 ? 'No hay historial de pagos' : 'No hay pagos que coincidan con los filtros'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    historialFiltrado.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{pago.inmueble}</TableCell>
                        <TableCell>{pago.propietario}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          ${parseFloat(pago.monto_pagado).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pago.pago_completo ? 'default' : 'secondary'}>
                            {pago.pago_completo ? 'Completo' : `Parcial (Resta: $${parseFloat(pago.saldo_restante).toFixed(2)})`}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{pago.recibo_numero}</TableCell>
                        <TableCell className="font-mono text-sm">{pago.referencia_bancaria}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </>
        )}

        {/* Modal para ver recibos */}
        {recibosDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Recibos del Propietario</h2>
                  <p className="text-sm text-gray-600">
                    {selectedMoroso?.propietario} - {selectedMoroso?.inmueble}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecibosDialogOpen(false)}
                >
                  ✕
                </Button>
              </div>
              
              {selectedMoroso?.recibos && selectedMoroso.recibos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMoroso.recibos.map((recibo) => (
                      <TableRow key={recibo.id}>
                        <TableCell>{recibo.numero_recibo}</TableCell>
                        <TableCell>{new Date(recibo.fecha_emision).toLocaleDateString()}</TableCell>
                        <TableCell>${parseFloat(recibo.monto_total_pagar).toFixed(2)}</TableCell>
                        <TableCell className={recibo.saldo_pendiente > 0 ? "font-bold text-red-600" : "font-bold text-green-600"}>
                          ${parseFloat(recibo.saldo_pendiente).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={recibo.estado === 'Pagado' ? 'default' : 'destructive'}>
                            {recibo.estado || 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {recibo.saldo_pendiente > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => handleRegistrarPago(recibo)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Registrar Pago
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              Pagado
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-gray-500">No hay recibos para este propietario</p>
              )}
            </div>
          </div>
        )}

        {/* Modal para registrar pago */}
        {pagoDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Registrar Pago</h2>
                  <p className="text-sm text-muted-foreground">
                    El pago se distribuirá automáticamente entre todos los recibos pendientes
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagoDialogOpen(false)}
                >
                  ✕
                </Button>
              </div>
              
              {selectedRecibo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Número de Recibo</Label>
                      <p className="font-medium">{selectedRecibo.numero_recibo}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha Emisión</Label>
                      <p className="font-medium">{new Date(selectedRecibo.fecha_emision).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Monto Total</Label>
                      <p className="font-medium">${parseFloat(selectedRecibo.monto_total_pagar).toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Saldo Pendiente</Label>
                      <p className="font-medium text-red-600">${parseFloat(selectedRecibo.saldo_pendiente).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="monto" className="text-xs text-muted-foreground">
                        Monto Pagado
                      </Label>
                      <Input
                        id="monto"
                        type="number"
                        step="0.01"
                        value={montoPagado}
                        onChange={(e) => setMontoPagado(e.target.value)}
                        className="mt-1 text-2xl font-bold text-green-600"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="referencia" className="text-xs text-muted-foreground">
                        Referencia Bancaria
                      </Label>
                      <Input
                        id="referencia"
                        value={referenciaBancaria}
                        onChange={(e) => setReferenciaBancaria(e.target.value)}
                        className="mt-1 font-mono"
                        placeholder="REF-2025-001"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">Distribución Automática</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      El pago se aplicará primero a los recibos más antiguos. Si el monto es mayor a la deuda total, 
                      el excedente se guardará como crédito para futuros pagos.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setPagoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmarPago} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!montoPagado || !referenciaBancaria}
                >
                  Registrar Pago
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para historial de pagos */}
        {historialDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Historial de Pagos</h2>
                  <p className="text-sm text-gray-600">
                    Registro completo de transacciones y aplicaciones de pago
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistorialDialogOpen(false)}
                >
                  ✕
                </Button>
              </div>
              
              {historialPagos && historialPagos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Recibo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto Aplicado</TableHead>
                      <TableHead>Crédito Generado</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialPagos.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell>{new Date(registro.fecha_transaccion).toLocaleDateString()}</TableCell>
                        <TableCell>{registro.recibo}</TableCell>
                        <TableCell>
                          <Badge variant={registro.tipo_transaccion === 'Sobrepago' ? 'secondary' : 'default'}>
                            {registro.tipo_transaccion}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ${parseFloat(registro.monto_aplicado).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {registro.monto_credito_generado > 0 ? `$${parseFloat(registro.monto_credito_generado).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{registro.referencia_bancaria}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-gray-500">No hay historial de pagos</p>
              )}
            </div>
          </div>
        )}
    </div>
  )
}