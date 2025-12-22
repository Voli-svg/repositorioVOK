import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Importación de Componentes ---
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Matches from './pages/matches/Matches';
import Tactics from './pages/tactics/Tactics';
import Finances from './pages/finances/Finances';
import Inventory from './pages/inventory/Inventory';
import MainLayout from './layouts/MainLayout';
import Injuries from './pages/injuries/Injuries'
import Players from './pages/players/Players';
import Attendance from './pages/attendance/Attendance';

// 1. IMPORTAR EL NUEVO PANEL DE ADMIN
import AdminPanel from './pages/admin/Adminpanel'; 

function App() {
  // VERIFICACIÓN REAL: Comprobamos si hay un token guardado
  const isAuthenticated = !!localStorage.getItem('token'); 

  return (
    <BrowserRouter>
      <Routes>
        {/* Si ya está logueado, redirigir de /login a / (Dashboard) */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />

        {isAuthenticated ? (
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/partidos" element={<Matches />} />
            <Route path="/tacticas" element={<Tactics />} />
            <Route path="/finanzas" element={<Finances />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/lesiones" element={<Injuries />} />
            <Route path="/players" element={<Players />} />
            <Route path="/attendance" element={<Attendance />} />
            
            {/* 2. AGREGAR LA NUEVA RUTA AQUÍ */}
            <Route path="/admin" element={<AdminPanel />} />
            
          </Route>
        ) : (
          // Si no hay token, cualquier ruta redirige al login
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;