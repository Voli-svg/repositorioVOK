import React, { useState, useEffect } from 'react';
import { hasRole } from "../../utils/auth"; 

export default function AdminPanel() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', 
    roles: [] 
  });

  // 1. CARGAR USUARIO ACTUAL (Simulación de Sesión)
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/users')
      .then(res => res.json())
      .then(data => {
        // Buscamos al usuario con ID 1 (Se asume que eres tú, el Super Admin)
        // Nota: Si el backend devolvió el "usuario de respaldo" por error, también funcionará.
        const myUser = Array.isArray(data) ? data.find(u => u.id == 1) : data;
        setCurrentUser(myUser);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCheckboxChange = (roleSlug) => {
    setFormData(prev => {
        const newRoles = prev.roles.includes(roleSlug)
            ? prev.roles.filter(r => r !== roleSlug) // Quitar
            : [...prev.roles, roleSlug]; // Agregar
        return { ...prev, roles: newRoles };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(formData.roles.length === 0) return alert("Selecciona al menos un rol");

    const res = await fetch('http://127.0.0.1:8000/api/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
    });
    
    if(res.ok) {
        alert("¡Usuario creado con éxito!");
        setFormData({ full_name: '', email: '', password: '', roles: [] }); // Limpiar
    } else {
        alert("Error al crear usuario");
    }
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (loading) return <div style={{padding: 20}}>Cargando permisos...</div>;

  // PROTECCIÓN: Si no hay usuario o no tiene rol Admin/Coach, bloqueamos
  if (!hasRole(currentUser, ['super_admin', 'coach'])) {
    return (
        <div style={{padding: 40, textAlign: 'center', color: '#ef4444'}}>
            <h2>⛔ Acceso Denegado</h2>
            <p>No tienes permisos para ver esta sección.</p>
            <p>Rol actual: {currentUser?.roles?.map(r => r.slug).join(', ') || 'Ninguno'}</p>
        </div>
    );
  }

  // SI TIENE PERMISO, MOSTRAMOS EL PANEL:
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{borderBottom: '2px solid #fbbf24', paddingBottom: '10px'}}>
        🛠️ Panel de Administración
      </h2>
      <p>Agregar nuevo miembro al equipo</p>

      <div style={{background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            
            <div>
                <label>Nombre Completo:</label>
                <input 
                    required
                    style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})} 
                />
            </div>
            
            <div>
                <label>Email:</label>
                <input 
                    required type="email"
                    style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                />
            </div>

            <div>
                <label>Contraseña Provisoria:</label>
                <input 
                    required minLength="6"
                    style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                />
            </div>
            
            <div style={{background: '#f8fafc', padding: '15px', borderRadius: '4px'}}>
                <p style={{fontWeight: 'bold', marginBottom: '10px'}}>Asignar Roles:</p>
                <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                    <label><input type="checkbox" checked={formData.roles.includes('player')} onChange={() => handleCheckboxChange('player')} /> Jugador</label>
                    <label><input type="checkbox" checked={formData.roles.includes('coach')} onChange={() => handleCheckboxChange('coach')} /> Entrenador</label>
                    <label><input type="checkbox" checked={formData.roles.includes('physio')} onChange={() => handleCheckboxChange('physio')} /> Kine</label>
                    <label><input type="checkbox" checked={formData.roles.includes('admin')} onChange={() => handleCheckboxChange('admin')} /> Tesorería</label>
                </div>
            </div>

            <button 
                type="submit" 
                style={{
                    background: '#0f172a', color: 'white', padding: '12px', 
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                }}
            >
                Crear Usuario
            </button>
        </form>
      </div>
    </div>
  );
}