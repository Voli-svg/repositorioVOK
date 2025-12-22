<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Importar Controladores
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PaymentController; // O FinanceController si lo llamaste así
use App\Http\Controllers\MatchController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\InjuryController; // <--- Faltaba esto seguramente
use App\Http\Controllers\AttendanceController; // <--- ¡ASEGÚRATE DE TENER ESTO!


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- AUTENTICACIÓN ---
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// --- USUARIOS ---
Route::get('/users', [UserController::class, 'index']); // Para selectores y admin
Route::post('/users', [UserController::class, 'store']); // Para crear usuarios

// --- INVENTARIO ---
Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/inventory', [InventoryController::class, 'store']);
Route::put('/inventory/{id}', [InventoryController::class, 'update']);
Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);


// --------------------------------------

// ... el resto de tus rutas ...
// GRUPO PROTEGIDO (Requiere estar logueado)
Route::middleware('auth:sanctum')->group(function () {
    
    // ... tus otras rutas protegidas ...

    // --- FINANZAS ---
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/user/{id}', [PaymentController::class, 'byUser']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::put('/payments/{id}/pay', [PaymentController::class, 'pay']);

});

// --- PARTIDOS ---
Route::get('/matches', [MatchController::class, 'index']);
Route::post('/matches', [MatchController::class, 'store']);
Route::put('/matches/{id}', [MatchController::class, 'update']);
Route::delete('/matches/{id}', [MatchController::class, 'destroy']);

// --- MURO SOCIAL ---
Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::put('/posts/{id}/like', [PostController::class, 'like']);
Route::delete('/posts/{id}', [PostController::class, 'destroy']);

// --- LESIONES (LO NUEVO) ---
Route::get('/injuries', [InjuryController::class, 'index']);
Route::post('/injuries', [InjuryController::class, 'store']);
Route::put('/injuries/{id}', [InjuryController::class, 'update']);

// --- GESTIÓN DE JUGADORES (COACH) ---
Route::get('/players-status', [UserController::class, 'indexWithStatus']);

// --- ASISTENCIA ---
Route::get('/attendance', [AttendanceController::class, 'index']);
Route::post('/attendance', [AttendanceController::class, 'store']);
