import { useState, useEffect } from 'react';
import { condominioService } from '../services/condominioService';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Building2,
  FileText,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';



export default function Propietarios() {
  const [propietarios, setPropietarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPropietario, setEditingPropietario] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    email: '',
  });

  useEffect(() => {
    loadPropietarios();
  }, []);

  const loadPropietarios = async () => {
    try {
      const response = await condominioService.getPropietarios();
      setPropietarios(response?.results || response || []);
    } catch (error) {
      console.error('Error loading propietarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(propietarios.length / itemsPerPage);

  // Filtrar propietarios
  const filteredPropietarios = propietarios.filter((propietario) => {
    const nombreCompleto = `${propietario.nombre} ${propietario.apellido}`;
    const matchesSearch =
      nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propietario.cedula.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPropietarios = filteredPropietarios.slice(startIndex, startIndex + itemsPerPage);

  const handleOpenModal = (propietario = null) => {
    if (propietario) {
      setEditingPropietario(propietario);
      setFormData({
        nombre: propietario.nombre,
        apellido: propietario.apellido,
        cedula: propietario.cedula,
        telefono: propietario.telefono,
        email: propietario.email,
      });
    } else {
      setEditingPropietario(null);
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        email: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPropietario(null);
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      telefono: '',
      email: '',
    });
  };

  const validateCedula = (cedula) => {
    const cedulaRegex = /^[VE]-?\d{1,2}\.?\d{3}\.?\d{3}$/;
    return cedulaRegex.test(cedula);
  };

  const formatTelefono = (telefono) => {
    const cleaned = telefono.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+58')) {
      return '+58 ' + cleaned.replace(/^(\+58)?/, '');
    }
    return telefono;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateCedula(formData.cedula)) {
      alert('Formato de cédula inválido');
      return;
    }

    try {
      if (editingPropietario) {
        await condominioService.updatePropietario(editingPropietario.id, formData);
      } else {
        await condominioService.createPropietario(formData);
      }
      loadPropietarios();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving propietario:', error);
      alert('Error al guardar propietario');
    }
  };

  if (loading) {
    return <div style={{padding: '24px', textAlign: 'center'}}>Cargando propietarios...</div>;
  }

  return (
    <div style={{padding: '0'}}>
      <div className="space-y-6">
        {/* Header */}
        <div style={{marginBottom: '24px'}}>
          <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px'}}>Gestión de Propietarios</h1>
          <p style={{color: '#6b7280', fontSize: '16px'}}>
            Administra la información de todos los propietarios del condominio
          </p>
        </div>

        {/* Filtros y Acciones */}
        <div style={{display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
            {/* Búsqueda */}
            <div style={{position: 'relative'}}>
              <Search style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', width: '16px', height: '16px'}} />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '40px',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  width: '300px'
                }}
              />
            </div>
          </div>

          {/* Botón Agregar */}
          <button 
            onClick={() => handleOpenModal()} 
            className="btn-primary"
            style={{display: 'flex', alignItems: 'center', gap: '8px'}}
          >
            <Plus style={{width: '16px', height: '16px'}} />
            Agregar Propietario
          </button>
        </div>
        
        {/* Modal */}
        {isModalOpen && (
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
            <div className="card" style={{width: '400px', maxWidth: '90vw'}}>
              <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>
                {editingPropietario ? 'Editar Propietario' : 'Agregar Nuevo Propietario'}
              </h3>
              <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Apellido</label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                      style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px'}}
                    />
                  </div>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Cédula</label>
                  <input
                    type="text"
                    placeholder="V12345678"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    required
                    style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Teléfono</label>
                  <input
                    type="text"
                    placeholder="04142374443"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    required
                    style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500'}}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px'}}
                  />
                </div>
                <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingPropietario ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="card" style={{padding: '0', overflow: 'hidden'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb'}}>
                <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Nombre</th>
                <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Cédula</th>
                <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Teléfono</th>
                <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151'}}>Email</th>
                <th style={{padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPropietarios.map((propietario) => (
                <tr key={propietario.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                  <td style={{padding: '12px', fontWeight: '500'}}>{propietario.nombre} {propietario.apellido}</td>
                  <td style={{padding: '12px'}}>{propietario.cedula}</td>
                  <td style={{padding: '12px'}}>{propietario.telefono}</td>
                  <td style={{padding: '12px'}}>{propietario.email}</td>
                  <td style={{padding: '12px', textAlign: 'center'}}>
                    <button 
                      onClick={() => handleOpenModal(propietario)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit style={{width: '14px', height: '14px'}} />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px'}}>
          <div style={{fontSize: '14px', color: '#6b7280'}}>
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredPropietarios.length)} de {filteredPropietarios.length} propietarios
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary"
              style={{display: 'flex', alignItems: 'center', gap: '4px'}}
            >
              <ChevronLeft style={{width: '16px', height: '16px'}} />
              Anterior
            </button>
            <span style={{padding: '8px 12px', fontSize: '14px'}}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-secondary"
              style={{display: 'flex', alignItems: 'center', gap: '4px'}}
            >
              Siguiente
              <ChevronRight style={{width: '16px', height: '16px'}} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
