import React, { useState, useEffect } from 'react';
import { hasRole } from '../../utils/auth';


export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Hoy
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  // Cargar lista cuando cambia la fecha
  useEffect(() => {
    fetchList();
  }, [date]);

  const fetchList = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`http://127.0.0.1:8000/api/attendance?date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        setList(data);
        setLoading(false);
    });
  };

  const handleStatusChange = (userId, newStatus) => {
    setList(list.map(item => 
        item.user_id === userId ? { ...item, status: newStatus } : item
    ));
  };

  const saveAttendance = async () => {
    const token = localStorage.getItem('token');
    try {
        await fetch('http://127.0.0.1:8000/api/attendance', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                date: date,
                attendances: list
            })
        });
        alert("✅ Asistencia guardada correctamente");
    } catch (error) {
        alert("Error al guardar");
    }
  };

  // PROTECCIÓN
  if (currentUser && !hasRole(currentUser, ['coach', 'admin', 'super_admin'])) {
      return <div style={{padding: 20}}>⛔ Solo entrenadores pueden pasar lista.</div>;
  }

  return (
    <div style={{padding: 20, maxWidth: 800, margin: '0 auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
            <h2>📝 Control de Asistencia</h2>
            <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                style={{padding: 10, borderRadius: 5, border: '1px solid #ccc'}} 
            />
        </div>

        {loading ? <p>Cargando lista...</p> : (
            <div style={{background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
                {list.map(player => (
                    <div key={player.user_id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                        <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{player.full_name}</span>
                        
                        <div style={{display: 'flex', gap: 5}}>
                            {/* BOTÓN PRESENTE */}
                            <button 
                                onClick={() => handleStatusChange(player.user_id, 'present')}
                                style={{
                                    padding: '8px 15px', borderRadius: 5, border: 'none', cursor: 'pointer',
                                    background: player.status === 'present' ? '#22c55e' : '#f1f5f9',
                                    color: player.status === 'present' ? 'white' : '#64748b',
                                    fontWeight: 'bold'
                                }}
                            >
                                Presente
                            </button>

                            {/* BOTÓN AUSENTE */}
                            <button 
                                onClick={() => handleStatusChange(player.user_id, 'absent')}
                                style={{
                                    padding: '8px 15px', borderRadius: 5, border: 'none', cursor: 'pointer',
                                    background: player.status === 'absent' ? '#ef4444' : '#f1f5f9',
                                    color: player.status === 'absent' ? 'white' : '#64748b',
                                    fontWeight: 'bold'
                                }}
                            >
                                Ausente
                            </button>

                            {/* BOTÓN JUSTIFICADO */}
                            <button 
                                onClick={() => handleStatusChange(player.user_id, 'excused')}
                                style={{
                                    padding: '8px 15px', borderRadius: 5, border: 'none', cursor: 'pointer',
                                    background: player.status === 'excused' ? '#eab308' : '#f1f5f9',
                                    color: player.status === 'excused' ? 'white' : '#64748b',
                                    fontWeight: 'bold'
                                }}
                            >
                                Justif.
                            </button>
                        </div>
                    </div>
                ))}

                <button 
                    onClick={saveAttendance}
                    style={{
                        width: '100%', marginTop: 20, padding: 15, background: '#3b82f6', 
                        color: 'white', border: 'none', borderRadius: 8, fontSize: '1.1rem', 
                        fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    💾 Guardar Asistencia
                </button>
            </div>
        )}
    </div>
  );
}