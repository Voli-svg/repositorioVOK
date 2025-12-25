import React, { useState, useEffect } from 'react';
import './Attendance.css';
export default function Attendance() {
  const [users, setUsers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Cargar lista al cambiar fecha
  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const fetchAttendance = () => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/attendance?date=${date}`)
      .then(res => res.json())
      .then(data => {
        // Inicializamos el estado local. Si viene null del back, lo dejamos null (sin marcar)
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Función para cambiar el estado en local (React)
  const handleStatusChange = (userId, newStatus) => {
    setUsers(users.map(u => 
        u.user_id === userId ? { ...u, status: newStatus } : u
    ));
  };

  // GUARDAR EN EL SERVIDOR
  const handleSave = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: date,
            attendances: users.map(u => ({
                user_id: u.user_id,
                // AQUÍ ESTÁ LA CLAVE: Enviamos el status tal cual lo tenemos en el estado
                // Asegúrate de que los botones guarden 'present', 'absent', 'justified'
                status: u.status, 
                remarks: u.remarks
            }))
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // SI FALLA: Mostramos el error real del backend
        alert("Error: " + result.message);
      } else {
        // SI FUNCIONA: Recién ahí mostramos éxito
        alert("✅ " + result.message);
      }

    } catch (error) {
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <div className="attendance-container">
      <h2>📋 Control de Asistencia</h2>
      
      <div className="date-picker-container">
        <label>Fecha:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="attendance-list">
          {users.map(user => (
            <div key={user.user_id} className="attendance-row">
              <span className="player-name">{user.full_name}</span>
              
              <div className="status-buttons">
                {/* BOTÓN PRESENTE */}
                <button 
                    className={`btn-att ${user.status === 'present' ? 'active-present' : ''}`}
                    onClick={() => handleStatusChange(user.user_id, 'present')} // ENVÍA 'present' (INGLÉS)
                >
                    Presente
                </button>

                {/* BOTÓN AUSENTE */}
                <button 
                    className={`btn-att ${user.status === 'absent' ? 'active-absent' : ''}`}
                    onClick={() => handleStatusChange(user.user_id, 'absent')} // ENVÍA 'absent' (INGLÉS)
                >
                    Ausente
                </button>

                {/* BOTÓN JUSTIFICADO */}
                <button 
                    className={`btn-att ${user.status === 'justified' ? 'active-justified' : ''}`}
                    onClick={() => handleStatusChange(user.user_id, 'justified')} // ENVÍA 'justified' (INGLÉS)
                >
                    Justif.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn-save-all" onClick={handleSave}>
        💾 Guardar Asistencia
      </button>
    </div>
  );
}