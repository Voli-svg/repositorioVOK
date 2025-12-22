// src/utils/auth.js

// Verifica si el usuario tiene AL MENOS UNO de los roles permitidos
// Ejemplo de uso: hasRole(user, ['coach', 'admin'])
export const hasRole = (user, allowedRoles) => {
  // 1. Si no hay usuario o no tiene roles cargados, denegamos acceso
  if (!user || !user.roles) return false;
  
  // 2. Convertimos a array si nos pasan un solo rol (ej: "coach")
  const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // 3. Buscamos si alguno de los roles del usuario coincide con los permitidos
  // Comparamos el "slug" (ej: 'coach', 'player') que viene de la base de datos
  return user.roles.some(userRole => rolesToCheck.includes(userRole.slug));
};

// Constantes para evitar errores de tipeo
export const ROLES = {
  COACH: 'coach',
  PLAYER: 'player',
  PHYSIO: 'physio',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};