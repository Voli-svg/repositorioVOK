import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Asegúrate de tener un CSS básico para que se vea bien

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // 1. Guardamos el Token y el Usuario en el navegador
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 2. Redirigimos al Dashboard
        // Forzamos una recarga para que App.jsx detecte el cambio de estado
        window.location.href = '/'; 
      } else {
        // Si falló (401), mostramos el mensaje del backend
        setError(data.message || 'Error al ingresar');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🏐 Vóley Intra</h2>
        <p>Inicia sesión para continuar</p>
        
        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn-login">Ingresar</button>
        </form>
      </div>
    </div>
  );
}