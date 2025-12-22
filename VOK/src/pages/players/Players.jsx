import React, { useState, useEffect } from 'react';
import { hasRole } from '../../utils/auth';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));

    const token = localStorage.getItem('token');
    fetch('http://127.0.0.1:8000/api/players-status', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setPlayers(data))
    .catch(err => console.error(err));
  }, []);

  if (currentUser && !hasRole(currentUser, ['coach', 'admin', 'super_admin'])) {
      return <div style={{padding: 20}}>⛔ Acceso denegado.</div>;
  }

  // Función para obtener color según porcentaje
  const getProgressColor = (pct) => {
      if (pct >= 80) return '#22c55e'; // Verde
      if (pct >= 50) return '#eab308'; // Amarillo
      return '#ef4444'; // Rojo
  };

  return (
    <div className="players-container" style={{padding: 20, maxWidth: 1100, margin: '0 auto'}}>
        <h2>📋 Gestión de Plantel</h2>
        
        <table className="matches-table" style={{width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
            <thead style={{background: '#1e293b', color: 'white'}}>
                <tr>
                    <th style={{padding: 15, textAlign: 'left'}}>Nombre</th>
                    <th style={{padding: 15, textAlign: 'left'}}>Roles</th>
                    {/* NUEVA COLUMNA */}
                    <th style={{padding: 15, width: '25%'}}>Asistencia Global</th> 
                    <th style={{padding: 15, textAlign: 'center'}}>Finanzas</th>
                    <th style={{padding: 15, textAlign: 'right'}}>Deuda</th>
                </tr>
            </thead>
            <tbody>
                {players.map(p => (
                    <tr key={p.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                        <td style={{padding: 15}}><strong>{p.full_name}</strong></td>
                        
                        <td style={{padding: 15}}>
                            {p.roles.map(r => (
                                <span key={r} style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, marginRight: 5, border: '1px solid #e2e8f0'}}>{r}</span>
                            ))}
                        </td>

                        {/* --- BARRA DE ASISTENCIA --- */}
                        <td style={{padding: 15}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                                <span style={{fontWeight: 'bold', width: '35px'}}>{p.attendance_pct}%</span>
                                <div style={{flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden'}}>
                                    <div style={{
                                        width: `${p.attendance_pct}%`,
                                        height: '100%',
                                        backgroundColor: getProgressColor(p.attendance_pct),
                                        transition: 'width 0.5s ease'
                                    }}></div>
                                </div>
                                <small style={{color: '#94a3b8', fontSize: 10}}>
                                    ({p.total_sessions} ses.)
                                </small>
                            </div>
                        </td>

                        <td style={{padding: 15, textAlign: 'center'}}>
                            {p.status === 'ok' ? (
                                <span style={{background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontWeight: 'bold', fontSize: 11}}>OK</span>
                            ) : (
                                <span style={{background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: 20, fontWeight: 'bold', fontSize: 11}}>DEUDA</span>
                            )}
                        </td>
                        
                        <td style={{padding: 15, textAlign: 'right', fontWeight: 'bold', color: p.debt > 0 ? '#ef4444' : '#94a3b8'}}>
                            ${p.debt.toLocaleString('es-CL')}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
}