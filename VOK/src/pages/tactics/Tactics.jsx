import React, { useRef, useState, useEffect } from 'react';
import './Tactics.css';

export default function Tactics() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  // NUEVO: Estado para guardar la imagen cargada en memoria
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Definimos el tamaño del lienzo
    canvas.width = 800; // Un poco más ancho para mejor detalle
    canvas.height = 450; 

    // --- NUEVO: Carga de la imagen de fondo ---
    const img = new Image();
    // Ruta a la imagen en la carpeta 'public'
    img.src = '/CanchaVoleyVOK.png'; 
    
    // Solo dibujamos cuando la imagen haya terminado de cargar
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Guardamos la imagen en el estado para reusarla al limpiar
      setBackgroundImage(img);
    };

  }, []);


  // --- Funciones de Dibujo (startDrawing, draw, stopDrawing) ---
  // (ESTAS SE MANTIENEN IGUAL QUE ANTES)
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  // --- Herramientas ---

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // 1. Borramos todo el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Si tenemos la imagen de fondo guardada, la volvemos a pintar
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
  };

  const savePlay = () => {
    // (ESTO SE MANTIENE IGUAL, ahora descargará la cancha + dibujos)
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'jugada-voley.png';
    link.href = canvas.toDataURL('image/png'); // Forzamos PNG para mejor calidad
    link.click();
  };

  return (
    <div className="tactics-container">
      <div className="tactics-header">
        <h2>📋 Pizarra Táctica</h2>
        <p>Dibuja estrategias y jugadas para el equipo</p>
      </div>

      <div className="controls-bar">
        {/* (ESTA PARTE DE LOS COLORES SE MANTIENE IGUAL) */}
        <div className="color-picker">
          {['#000000', '#dc2626', '#2563eb', '#ffffff'].map((c) => (
            <div 
              key={c}
              className={`color-btn ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none' }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        
        <button className="action-btn" onClick={clearBoard}>🗑️ Limpiar</button>
        <button className="action-btn btn-save" onClick={savePlay}>💾 Guardar Jugada</button>
      </div>

      {/* Quitamos la clase 'volleyball-court-bg' porque ya no necesitamos 
          el fondo CSS, la imagen está DENTRO del canvas.
      */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
}