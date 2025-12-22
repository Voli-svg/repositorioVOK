import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom'; 
import './MainLayout.css';
import { hasRole } from '../utils/auth';

export default function MainLayout() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // 1. Cargamos al usuario desde el localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Función para Cerrar Sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload(); // Recarga para limpiar estados de React
  };

  return (
    <div className="layout-container">
      {/* --- Sidebar (Menú Lateral) --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Vóley Intra</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {/* --- SECCIÓN GENERAL (Visible para todos) --- */}
            <li><Link to="/">📊 Muro Social</Link></li>
            <li><Link to="/partidos">🏐 Partidos</Link></li>
            <li><Link to="/tacticas">📋 Pizarra Táctica</Link></li>
            <li><Link to="/finanzas">💰 Finanzas</Link></li>
            <li><Link to="/inventario">📦 Inventario</Link></li>
            <li><Link to="/lesiones">🏥 Enfermería</Link></li>
{/* --- NUEVA SECCIÓN: GESTIÓN TÉCNICA --- */}
{hasRole(currentUser, ['coach', 'admin', 'super_admin']) && (
    <>
        {/* Usamos la nueva clase CSS limpia */}
        <li className="section-label">
            Gestión Técnica
        </li>

        <li><Link to="/players">📋 Plantel</Link></li>
        <li><Link to="/attendance">📝 Asistencia</Link></li>
    </>
)}
            {/* --- BOTÓN ADMIN (Protegido por roles) --- */}
            {hasRole(currentUser, ['super_admin', 'coach']) && (
               <li style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                 <Link to="/admin" style={{ color: '#fbbf24' }}>
                   ⚙️ Panel Admin
                 </Link>
               </li>
            )}

          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn" style={{background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left'}}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* --- Área de Contenido Principal --- */}
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}