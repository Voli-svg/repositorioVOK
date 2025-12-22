<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validamos datos de entrada
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 2. Verificamos credenciales básicas
        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // 3. INTENTAMOS GENERAR EL TOKEN
        try {
            // --- AQUÍ ESTABA EL ERROR ---
            // Agregamos ->with('roles') para que traiga los permisos
            $user = User::where('email', $request->email)->with('roles')->first();
            
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Bienvenido',
                'user' => $user, // Ahora este usuario SÍ incluye sus roles
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'titulo' => 'ERROR CRÍTICO EN LOGIN',
                'mensaje_tecnico' => $e->getMessage(),
                'archivo' => $e->getFile(),
                'linea' => $e->getLine()
            ], 500);
        }
    }
    
    public function logout()
    {
        // Borra el token actual
        auth()->user()->tokens()->delete();
        return response()->json(['message' => 'Sesión cerrada']);
    }
}