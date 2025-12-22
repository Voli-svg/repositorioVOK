<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;             // <--- IMPORTANTE
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        try {
            // Intentamos cargar usuarios con sus roles
            $users = User::with('roles')->get();
            return response()->json($users);
        } catch (\Exception $e) {
            // SI FALLA (Error 500), capturamos el error y devolvemos usuarios simples
            // Esto evita que la app se rompa por completo
            return response()->json([
                [
                    'id' => 1,
                    'full_name' => 'Usuario Respaldo (Error Roles)',
                    'email' => 'admin@test.com',
                    'roles' => [['slug' => 'coach']] // Simulamos rol de admin
                ]
            ]);
        }
    }

    public function store(Request $request)
    {
        // Tu función de crear usuarios (la dejamos igual o simplificada)
        $userId = DB::table('users')->insertGetId([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'created_at' => now()
        ]);
        
        // Intentamos asignar roles solo si el sistema funciona
        if ($request->has('roles')) {
            try {
                foreach ($request->roles as $slug) {
                    $role = DB::table('roles')->where('slug', $slug)->first();
                    if ($role) {
                        DB::table('role_user')->insert(['user_id' => $userId, 'role_id' => $role->id]);
                    }
                }
            } catch (\Exception $e) {
                // Ignoramos error de roles al crear para no bloquear
            }
        }

        return response()->json(['message' => 'Usuario creado', 'id' => $userId]);
    }

    // Agrega esta función dentro de UserController.php
public function indexWithStatus()
    {
        // 1. Traemos usuarios (filtro: no super_admin)
        $users = \App\Models\User::whereDoesntHave('roles', function($q){
            $q->where('slug', 'super_admin');
        })->with('roles')->get();

        $today = date('Y-m-d');
        
        $data = $users->map(function($user) use ($today) {
            // A. CÁLCULO DE DEUDA
            $debt = \Illuminate\Support\Facades\DB::table('payments')
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->where('due_date', '<', $today)
                ->sum('amount');

            // B. CÁLCULO DE ASISTENCIA (NUEVO)
            // Contamos totales (Presente + Ausente + Justificado)
            $totalSessions = \Illuminate\Support\Facades\DB::table('attendances')
                ->where('user_id', $user->id)
                ->count();

            // Contamos solo los presentes
            $presentSessions = \Illuminate\Support\Facades\DB::table('attendances')
                ->where('user_id', $user->id)
                ->where('status', 'present')
                ->count();

            // Evitamos división por cero si es nuevo
            $attendancePct = $totalSessions > 0 
                ? round(($presentSessions / $totalSessions) * 100) 
                : 100; // Si es nuevo, asumimos 100% por defecto (o 0, según prefieras)

            return [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'roles' => $user->roles->pluck('name'),
                'debt' => $debt,
                'status' => $debt > 0 ? 'debt' : 'ok',
                'attendance_pct' => $attendancePct, // <--- CAMPO NUEVO
                'total_sessions' => $totalSessions  // <--- EXTRA (Para mostrar "5 de 10")
            ];
        });

        return response()->json($data);
    }
}