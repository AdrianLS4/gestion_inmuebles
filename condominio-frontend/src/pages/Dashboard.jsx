import DashboardStats from '../components/DashboardStats';
import QuickActions from '../components/Quick-Actions';
import RevenueChart from '../components/Revenue-Chart';

export default function Dashboard() {
  return (
    <div style={{padding: '0'}}>
      <div style={{marginBottom: '24px'}}>
        <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px'}}>Dashboard</h1>
        <p style={{color: '#6b7280', fontSize: '16px'}}>Resumen general de la administración del condominio</p>
      </div>

      <DashboardStats />

      <div style={{display: 'grid', gap: '24px', gridTemplateColumns: '2fr 1fr', marginTop: '24px'}}>
        <div>
          <RevenueChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
