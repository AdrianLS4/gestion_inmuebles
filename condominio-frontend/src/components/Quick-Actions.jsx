import { Receipt, CreditCard, AlertTriangle, Plus, FileText } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const actions = [
  {
    title: "Generar Recibos",
    description: "Crear recibos del mes actual",
    icon: Receipt,
    color: "#2563eb",
  },
  {
    title: "Verificar Pagos",
    description: "Revisar pagos recientes",
    icon: CreditCard,
    color: "#6b7280",
  },
  {
    title: "Ver Morosos",
    description: "Lista de propietarios morosos",
    icon: AlertTriangle,
    color: "#dc2626",
  },
  {
    title: "Nuevo Gasto",
    description: "Registrar gasto común",
    icon: Plus,
    color: "#16a34a",
  },
  {
    title: "Ver Reportes",
    description: "Generar reportes financieros",
    icon: FileText,
    color: "#ea580c",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();
  
  const handleAction = (actionTitle) => {
    switch(actionTitle) {
      case 'Generar Recibos':
        navigate('/recibos');
        break;
      case 'Verificar Pagos':
        navigate('/pagos');
        break;
      case 'Ver Morosos':
        navigate('/pagos');
        break;
      case 'Nuevo Gasto':
        navigate('/gastos');
        break;
      case 'Ver Reportes':
        alert('Funcionalidad de reportes próximamente');
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="card">
      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Acciones Rápidas</h3>
      <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '16px'}}>Acciones frecuentes para la administración</p>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button 
              key={action.title}
              onClick={() => handleAction(action.title)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              <Icon style={{width: '20px', height: '20px', color: action.color, flexShrink: 0}} />
              <div>
                <div style={{fontWeight: '500', color: '#111827'}}>{action.title}</div>
                <div style={{fontSize: '12px', color: '#6b7280', opacity: 0.7}}>{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
