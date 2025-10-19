import { useState, useEffect } from 'react';
import { condominioService } from '../services/condominioService';
import { Users, Building, FileText, AlertTriangle } from 'lucide-react';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalInmuebles: 0,
    recibosPendientes: 0,
    montoTotal: 0,
    morosos: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [inmuebles, recibos, morosos] = await Promise.all([
        condominioService.getInmuebles(),
        condominioService.getRecibos(),
        condominioService.getMorosos()
      ]);

      const recibosArray = recibos?.results || recibos || [];
      const inmueblesArray = inmuebles?.results || inmuebles || [];
      const morososArray = morosos || [];
      
      const recibosPendientes = recibosArray.filter(r => r.saldo_pendiente > 0);
      const montoTotal = recibosPendientes.reduce((sum, r) => sum + parseFloat(r.saldo_pendiente || 0), 0);
      
      // Contar solo los verdaderos morosos (más de 3 recibos pendientes)
      const morososReales = morososArray.filter(m => m.es_moroso === true);

      setStats({
        totalInmuebles: inmueblesArray.length,
        recibosPendientes: recibosPendientes.length,
        montoTotal: montoTotal,
        morosos: morososReales.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Inmuebles',
      value: stats.totalInmuebles,
      icon: Building,
      color: '#2563eb'
    },
    {
      title: 'Recibos Pendientes',
      value: stats.recibosPendientes,
      icon: FileText,
      color: '#ea580c'
    },
    {
      title: 'Monto por Cobrar',
      value: `$${stats.montoTotal.toFixed(2)}`,
      icon: Users,
      color: '#16a34a'
    },
    {
      title: 'Propietarios Morosos',
      value: stats.morosos,
      icon: AlertTriangle,
      color: '#dc2626'
    }
  ];

  return (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px'}}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="card">
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div style={{padding: '12px', borderRadius: '8px', backgroundColor: '#f3f4f6'}}>
                <Icon style={{width: '24px', height: '24px', color: stat.color}} />
              </div>
              <div style={{marginLeft: '16px'}}>
                <p style={{fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px'}}>{stat.title}</p>
                <p style={{fontSize: '24px', fontWeight: 'bold', color: '#111827'}}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}