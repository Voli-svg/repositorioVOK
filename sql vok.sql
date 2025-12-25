-- 1. PREPARACIÓN DE LA BASE DE DATOS
DROP DATABASE IF EXISTS voley_intranet; -- ¡Cuidado! Esto borra la anterior para empezar limpio
CREATE DATABASE voley_intranet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voley_intranet;

-- 2. TABLA DE USUARIOS (Estructura Limpia)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 3. SISTEMA DE ROLES (Multi-Rol)
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, 
    slug VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'coach', 'player'
    description TEXT
);

CREATE TABLE role_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 4. TABLAS DE NEGOCIO (Partidos, Pagos, Etc.)

-- Partidos
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rival VARCHAR(100) NOT NULL,
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    location VARCHAR(150),
    status ENUM('scheduled', 'finished', 'cancelled') DEFAULT 'scheduled',
    score_local INT DEFAULT 0,
    score_visit INT DEFAULT 0,
    sets_detail VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Finanzas
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    concept VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NULL,
    status ENUM('paid', 'pending') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inventario
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT DEFAULT 1,
    condition_status ENUM('new', 'good', 'fair', 'damaged') DEFAULT 'good',
    assigned_to VARCHAR(100),
    last_check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

-- Pizarra Táctica
CREATE TABLE tactics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    image_path VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Muro Social
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Lesiones (Kinesiología)
CREATE TABLE injuries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('baja', 'media', 'alta') DEFAULT 'baja',
    status ENUM('pendiente', 'tratamiento', 'alta') DEFAULT 'pendiente',
    diagnosis TEXT,
    treated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (treated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tablas de Sistema (Laravel Sanctum / Sessiones)
CREATE TABLE personal_access_tokens (
    id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    tokenable_type varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    tokenable_id bigint(20) unsigned NOT NULL,
    name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    token varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
    abilities text COLLATE utf8mb4_unicode_ci,
    last_used_at timestamp NULL DEFAULT NULL,
    expires_at timestamp NULL DEFAULT NULL,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY personal_access_tokens_token_unique (token),
    KEY personal_access_tokens_tokenable_type_tokenable_id_index (tokenable_type,tokenable_id)
);

CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload LONGTEXT NOT NULL,
    last_activity INT NOT NULL
);
-- =======================================================
-- tabla de asistencia
-- =======================================================
CREATE TABLE attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'justified') DEFAULT 'absent',
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- =======================================================
-- 5. POBLADO DE DATOS (SEEDING) - CORREGIDO
-- =======================================================

-- A) Insertar Roles (Incluyendo 'admin')
-- Usamos INSERT IGNORE para que no de error si ya existen algunos
INSERT IGNORE INTO roles (id, name, slug, description) VALUES 
(1, 'Super Admin', 'super_admin', 'Control total técnico y de sistema'),
(2, 'Entrenador', 'coach', 'Gestiona partidos, tácticas y entrenamientos'),
(3, 'Jugador', 'player', 'Ve partidos, paga cuotas, reporta lesiones'),
(4, 'Kinesiólogo', 'physio', 'Gestiona y da de alta lesiones'),
(5, 'Administrador', 'admin', 'Gestión administrativa: pagos, inventario y usuarios');

-- B) Insertar TU USUARIO (Super Admin)
-- Pass: admin123
INSERT IGNORE INTO users (id, full_name, email, password) VALUES (
    1,
    'Benjamin Almonacid', 
    'admin@vok.cl', 
    '$2y$10$wS1.0/I7lW1s1/X1.0/I7Ou/X1.0/I7lW1s1/X1.0/I7lW1s1.' 
);

-- C) Asignar Roles al Usuario ID 1
-- Te asignamos TODO para que puedas probar cualquier vista
INSERT IGNORE INTO role_user (user_id, role_id) VALUES (1, 1); -- super_admin
INSERT IGNORE INTO role_user (user_id, role_id) VALUES (1, 2); -- coach
INSERT IGNORE INTO role_user (user_id, role_id) VALUES (1, 3); -- player
INSERT IGNORE INTO role_user (user_id, role_id) VALUES (1, 5); -- admin (EL NUEVO)