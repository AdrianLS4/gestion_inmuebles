import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Building, DollarSign, FileText, 
  CreditCard, BarChart3, Settings, Menu, X, CheckCircle, User 
} from 'lucide-react';
import UserProfile from './UserProfile';

const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/propietarios', icon: Users, label: 'Propietarios' },
  { path: '/inmuebles', icon: Building, label: 'Inmuebles' },
  { path: '/gastos', icon: DollarSign, label: 'Gastos' },
  { path: '/recibos', icon: FileText, label: 'Recibos' },
  { path: '/pagos', icon: CreditCard, label: 'Pagos' },
  { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  { path: '/configuracion-recibos', icon: Settings, label: 'Configuración' },
  { path: '/verificacion-automatica', icon: CheckCircle, label: 'Verificación Auto' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform 
        duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary">Los Jardines</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary text-white border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Condominio Los Jardines
            </h2>
          </div>
          
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:block text-sm">Perfil</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* User Profile Modal */}
      <UserProfile 
        isOpen={profileOpen} 
        onClose={() => setProfileOpen(false)} 
      />
    </div>
  );
}