import { BarChart3 } from "lucide-react";
import { useState, useEffect } from 'react';
import { condominioService } from '../services/condominioService';

export default function RevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadChartData();
  }, []);
  
  const loadChartData = async () => {
    try {
      const [recibosRes, pagosRes] = await Promise.all([
        condominioService.getRecibos(),
        condominioService.getPagos()
      ]);
      
      const recibos = recibosRes?.results || recibosRes || [];
      const pagos = pagosRes?.results || pagosRes || [];
      
      // Generar datos de los últimos 6 meses
      const chartData = [];
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesNum = fecha.getMonth();
        const año = fecha.getFullYear();
        const mesStr = `${año}-${String(mesNum + 1).padStart(2, '0')}`;
        
        // Calcular ingresos del mes (pagos realizados)
        const ingresosMes = pagos
          .filter(pago => pago.fecha_pago && pago.fecha_pago.startsWith(mesStr))
          .reduce((sum, pago) => sum + parseFloat(pago.monto_pagado || 0), 0);
        
        chartData.push({
          month: meses[mesNum],
          ingresos: ingresosMes
        });
      }
      
      setData(chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Datos de fallback
      setData([
        { month: "Jul", ingresos: 0 },
        { month: "Ago", ingresos: 0 },
        { month: "Sep", ingresos: 0 },
        { month: "Oct", ingresos: 0 },
        { month: "Nov", ingresos: 0 },
        { month: "Dic", ingresos: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="card">
        <div style={{padding: '40px', textAlign: 'center', color: '#6b7280'}}>
          Cargando datos del gráfico...
        </div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.ingresos), 1000); // Mínimo 1000 para evitar división por 0
  
  return (
    <div className="card">
      <div style={{marginBottom: '24px'}}>
        <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Ingresos por Mes</h3>
        <p style={{color: '#6b7280', fontSize: '14px'}}>Ingresos totales de los últimos 6 meses</p>
      </div>
      
      <div style={{height: '300px', display: 'flex', alignItems: 'end', gap: '16px', padding: '20px 0'}}>
        {data.map((item, index) => {
          const height = (item.ingresos / maxValue) * 250;
          return (
            <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div 
                style={{
                  width: '100%',
                  height: `${height}px`,
                  backgroundColor: '#2563eb',
                  borderRadius: '4px 4px 0 0',
                  marginBottom: '8px',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                title={`${item.month}: $${item.ingresos.toLocaleString()}`}
              >
                <div 
                  style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ${(item.ingresos / 1000).toFixed(0)}k
                </div>
              </div>
              <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500'}}>{item.month}</span>
            </div>
          );
        })}
      </div>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px'}}>
        <BarChart3 style={{width: '16px', height: '16px', color: '#6b7280'}} />
        <span style={{fontSize: '14px', color: '#6b7280'}}>Promedio mensual: ${data.length > 0 ? (data.reduce((sum, d) => sum + d.ingresos, 0) / data.length).toLocaleString() : '0'}</span>
      </div>
    </div>
  );
}
