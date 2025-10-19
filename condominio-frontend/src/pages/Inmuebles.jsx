"use client"

import { useState, useEffect, useMemo } from "react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog"
import { Building2, Home, Plus, Search, Edit, Eye } from "lucide-react"
import { condominioService } from "../services/condominioService"

export default function InmueblesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEdificio, setSelectedEdificio] = useState("")
  const [selectedPropietario, setSelectedPropietario] = useState("")
  const [selectedEstado, setSelectedEstado] = useState("Todos los estados")
  const [isEdificioModalOpen, setIsEdificioModalOpen] = useState(false)
  const [isApartamentoModalOpen, setIsApartamentoModalOpen] = useState(false)
  const [editingEdificio, setEditingEdificio] = useState(null)
  const [editingApartamento, setEditingApartamento] = useState(null)
  
  const [edificios, setEdificios] = useState([])
  const [inmuebles, setInmuebles] = useState([])
  const [propietarios, setPropietarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log('Loading data...')
      const [edificiosData, inmueblesData, propietariosData] = await Promise.all([
        condominioService.getEdificios(),
        condominioService.getInmuebles(),
        condominioService.getPropietarios()
      ])
      console.log('Data loaded:', { edificiosData, inmueblesData, propietariosData })
      setEdificios(edificiosData.results || edificiosData)
      setInmuebles(inmueblesData.results || inmueblesData)
      setPropietarios(propietariosData.results || propietariosData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApartamentos = useMemo(() => {
    if (!Array.isArray(inmuebles)) return []
    return inmuebles.filter((apt) => {
      const propietarioNombre = `${apt.propietario?.nombre || ''} ${apt.propietario?.apellido || ''}`.trim()
      const matchesSearch =
        propietarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.apartamento?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesEdificio = !selectedEdificio || selectedEdificio === "Todos los edificios" || apt.edificio?.numero_edificio === selectedEdificio
      const matchesPropietario = !selectedPropietario || selectedPropietario === "Todos los propietarios" || propietarioNombre === selectedPropietario
      return matchesSearch && matchesEdificio && matchesPropietario
    })
  }, [inmuebles, searchTerm, selectedEdificio, selectedPropietario])

  const filteredEdificios = useMemo(() => {
    if (!Array.isArray(edificios)) return []
    return edificios.filter((edificio) => {
      const matchesSearch =
        edificio.numero_edificio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        edificio.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesEstado = selectedEstado === "Todos los estados" || edificio.estado === selectedEstado
      return matchesSearch && matchesEstado
    })
  }, [edificios, searchTerm, selectedEstado])

  if (loading) {
    return <div className="p-6">Cargando datos...</div>
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Inmuebles</h1>
            <p className="text-gray-600">Dashboard / Inmuebles</p>
            <p className="text-sm text-gray-500">Edificios: {edificios.length} | Inmuebles: {inmuebles.length} | Propietarios: {propietarios.length}</p>
          </div>
        </div>



        {/* Tabs */}
        <Tabs defaultValue="edificios" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="edificios" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Edificios
              </TabsTrigger>
              <TabsTrigger value="apartamentos" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Apartamentos
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button onClick={() => {
                setEditingEdificio(null)
                setIsEdificioModalOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Edificio
              </Button>

              <Button variant="outline" onClick={() => {
                setEditingApartamento(null)
                setIsApartamentoModalOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Apartamento
              </Button>
              
              {isEdificioModalOpen && (
                <EdificioModal edificio={editingEdificio} onClose={() => setIsEdificioModalOpen(false)} />
              )}
              
              {isApartamentoModalOpen && (
                <ApartamentoModal apartamento={editingApartamento} onClose={() => setIsApartamentoModalOpen(false)} />
              )}
            </div>
          </div>

          {/* Tab Edificios */}
          <TabsContent value="edificios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Edificios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar por número o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos los estados">Todos los estados</SelectItem>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabla */}
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Número</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Descripción
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Total Apartamentos
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEdificios.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-4">No hay edificios para mostrar</td></tr>
                      ) : filteredEdificios.map((edificio) => (
                        <tr key={edificio.id} className="border-b">
                          <td className="h-12 px-4 align-middle font-medium">{edificio.numero_edificio}</td>
                          <td className="h-12 px-4 align-middle">{edificio.descripcion}</td>
                          <td className="h-12 px-4 align-middle">{inmuebles.filter(i => i.edificio?.id === edificio.id).length}</td>
                          <td className="h-12 px-4 align-middle">
                            <Badge variant={edificio.estado === "Activo" ? "default" : "secondary"}>
                              {edificio.estado}
                            </Badge>
                          </td>
                          <td className="h-12 px-4 align-middle">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => alert(`Edificio: ${edificio.numero_edificio}\nDescripción: ${edificio.descripcion}\nEstado: ${edificio.estado}\nApartamentos: ${inmuebles.filter(i => i.edificio?.id === edificio.id).length}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingEdificio(edificio)
                                  setIsEdificioModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Apartamentos */}
          <TabsContent value="apartamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Apartamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar por propietario o apartamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedEdificio} onValueChange={setSelectedEdificio}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos los edificios">Todos los edificios</SelectItem>
                      {Array.isArray(edificios) && edificios.map((edificio) => (
                        <SelectItem key={edificio.id} value={edificio.numero_edificio}>
                          Edificio {edificio.numero_edificio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPropietario} onValueChange={setSelectedPropietario}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por propietario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos los propietarios">Todos los propietarios</SelectItem>
                      {Array.isArray(propietarios) && propietarios.map((propietario) => (
                        <SelectItem key={propietario.id} value={`${propietario.nombre} ${propietario.apellido}`}>
                          {propietario.nombre} {propietario.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabla */}
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Edificio</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Piso</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Apartamento
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Propietario
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Alícuota (%)
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApartamentos.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-4">No hay apartamentos para mostrar</td></tr>
                      ) : filteredApartamentos.map((apartamento) => (
                        <tr key={apartamento.id} className="border-b">
                          <td className="h-12 px-4 align-middle font-medium">{apartamento.edificio?.numero_edificio}</td>
                          <td className="h-12 px-4 align-middle">{apartamento.piso}</td>
                          <td className="h-12 px-4 align-middle">{apartamento.apartamento}</td>
                          <td className="h-12 px-4 align-middle">{apartamento.propietario?.nombre} {apartamento.propietario?.apellido}</td>
                          <td className="h-12 px-4 align-middle">{(parseFloat(apartamento.alicuota) * 100).toFixed(2)}%</td>
                          <td className="h-12 px-4 align-middle">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => alert(`Edificio: ${apartamento.edificio?.numero_edificio}\nPiso: ${apartamento.piso}\nApartamento: ${apartamento.apartamento}\nPropietario: ${apartamento.propietario?.nombre} ${apartamento.propietario?.apellido}\nAlícuota: ${(parseFloat(apartamento.alicuota) * 100).toFixed(2)}%`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingApartamento(apartamento)
                                  setIsApartamentoModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}

// Modal para Edificio
function EdificioModal({ edificio, onClose }) {
  const [formData, setFormData] = useState({
    numero_edificio: edificio?.numero_edificio || "",
    descripcion: edificio?.descripcion || "",
    estado: edificio?.estado || "Activo",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (edificio) {
        await condominioService.updateEdificio(edificio.id, formData)
      } else {
        await condominioService.createEdificio(formData)
      }
      window.location.reload()
      onClose()
    } catch (error) {
      console.error('Error saving edificio:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">✕</button>
        <h2 className="text-lg font-semibold mb-4">{edificio ? "Editar Edificio" : "Nuevo Edificio"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Número de Edificio *</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.numero_edificio}
              onChange={(e) => setFormData({ ...formData, numero_edificio: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.estado} 
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Guardando..." : (edificio ? "Actualizar" : "Crear")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para Apartamento
function ApartamentoModal({ apartamento, onClose }) {
  const [formData, setFormData] = useState({
    edificio: apartamento?.edificio?.id || "",
    propietario: apartamento?.propietario?.id || "",
    piso: apartamento?.piso || "",
    apartamento: apartamento?.apartamento || "",
    alicuota: apartamento?.alicuota || "",
  })
  const [edificios, setEdificios] = useState([])
  const [propietarios, setPropietarios] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSelectData()
  }, [])

  const loadSelectData = async () => {
    try {
      const [edificiosData, propietariosData] = await Promise.all([
        condominioService.getEdificios(),
        condominioService.getPropietarios()
      ])
      setEdificios(edificiosData.results || edificiosData)
      setPropietarios(propietariosData.results || propietariosData)
    } catch (error) {
      console.error('Error loading select data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Validar que los campos requeridos no estén vacíos
    if (!formData.edificio || !formData.propietario || !formData.piso || !formData.apartamento || !formData.alicuota) {
      alert('Por favor complete todos los campos requeridos')
      setLoading(false)
      return
    }
    
    const dataToSend = {
      propietario: parseInt(formData.propietario),
      edificio: parseInt(formData.edificio),
      piso: formData.piso,
      apartamento: formData.apartamento,
      alicuota: parseFloat(formData.alicuota)
    }
    
    console.log('Sending data:', dataToSend)
    
    try {
      if (apartamento) {
        await condominioService.updateInmueble(apartamento.id, dataToSend)
      } else {
        await condominioService.createInmueble(dataToSend)
      }
      window.location.reload()
      onClose()
    } catch (error) {
      console.error('Error saving inmueble:', error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">✕</button>
        <h2 className="text-lg font-semibold mb-4">{apartamento ? "Editar Apartamento" : "Nuevo Apartamento"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Edificio *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.edificio} 
              onChange={(e) => setFormData({ ...formData, edificio: parseInt(e.target.value) })}
              required
            >
              <option value="">Seleccionar edificio</option>
              {edificios.map((edificio) => (
                <option key={edificio.id} value={edificio.id}>
                  Edificio {edificio.numero_edificio} - {edificio.descripcion}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Propietario *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.propietario} 
              onChange={(e) => setFormData({ ...formData, propietario: parseInt(e.target.value) })}
              required
            >
              <option value="">Seleccionar propietario</option>
              {propietarios.map((propietario) => (
                <option key={propietario.id} value={propietario.id}>
                  {propietario.nombre} {propietario.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Piso *</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.piso}
              onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apartamento *</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.apartamento}
              onChange={(e) => setFormData({ ...formData, apartamento: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alícuota (%) *</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              type="number"
              step="0.01"
              value={formData.alicuota}
              onChange={(e) => setFormData({ ...formData, alicuota: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Guardando..." : (apartamento ? "Actualizar" : "Crear")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
