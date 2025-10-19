import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Shield, LogOut, Edit2, Save, X } from "lucide-react"
import { authService } from "@/services/condominioService"

export default function UserProfile({ isOpen, onClose }) {
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const loadUserData = async () => {
    try {
      const userData = await authService.getUserInfo()
      setUser(userData.user)
      setFormData({
        username: userData.user.username || '',
        email: userData.user.email || '',
        first_name: userData.user.first_name || '',
        last_name: userData.user.last_name || ''
      })
    } catch (error) {
      console.error('Error cargando datos del usuario:', error)
    }
  }

  const handleSave = async () => {
    try {
      await authService.updateProfile(formData)
      setUser({ ...user, ...formData })
      setEditing(false)
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      alert('Error al actualizar el perfil')
    }
  }

  const handleLogout = () => {
    authService.logout()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Perfil de Usuario</CardTitle>
            <CardDescription>Gestiona tu información personal</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <>
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {user.first_name || user.last_name 
                      ? `${user.first_name} ${user.last_name}`.trim()
                      : user.username
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrador
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="username">Usuario</Label>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <div className="space-x-2">
                  {editing ? (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" />
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
                
                <Button size="sm" variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Cerrar Sesión
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}