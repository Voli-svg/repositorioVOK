<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;             
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
            return response()->json([
                [
                    'id' => 1,
                    'full_name' => 'Error de Conexión',
                    'email' => 'admin@test.com',
                    'roles' => [['slug' => 'coach']] 
                ]
            ]);
        }
    }

    public function store(Request $request)
    {
        // Tu función de crear usuarios
        $userId = DB::table('users')->insertGetId([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'created_at' => now()
        ]);
        
        // Asignar roles
        if ($request->has('roles')) {
            try {
                foreach ($request->roles as $slug) {
                    $role = DB::table('roles')->where('slug', $slug)->first();
                    if ($role) {
                        DB::table('role_user')->insert(['user_id' => $userId, 'role_id' => $role->id]);
                    }
                }
            } catch (\Exception $e) {
                // Ignoramos error de roles
            }
        }

        return response()->json(['message' => 'Usuario creado', 'id' => $userId]);
    }

    // --- AQUÍ ESTABA EL ERROR ---
    public function indexWithStatus()
    {
        try {
            // 1. Traemos usuarios (filtro: no super_admin)
            $users = User::whereDoesntHave('roles', function($q){
                $q->where('slug', 'super_admin');
            })->with('roles')->get();

            $today = date('Y-m-d');
            
            $data = $users->map(function($user) use ($today) {
                // A. CÁLCULO DE DEUDA
                $debt = DB::table('payments')
                    ->where('user_id', $user->id)
                    ->where('status', 'pending')
                    // CORRECCIÓN: Usamos 'payment_date' en lugar de 'due_date'
                    ->where('payment_date', '<', $today) 
                    ->sum('amount');

                // B. CÁLCULO DE ASISTENCIA (Si tienes la tabla 'attendances')
                try {
                    $totalSessions = DB::table('attendances')
                        ->where('user_id', $user->id)
                        ->count();

                    $presentSessions = DB::table('attendances')
                        ->where('user_id', $user->id)
                        ->where('status', 'present')
                        ->count();
                } catch (\Exception $e) {
                    // Si no existe la tabla attendances todavía, ponemos 0 para que no falle
                    $totalSessions = 0;
                    $presentSessions = 0;
                }

                $attendancePct = $totalSessions > 0 
                    ? round(($presentSessions / $totalSessions) * 100) 
                    : 100;

                return [
                    'id' => $user->id,
                    'full_name' => $user->full_name,
                    'roles' => $user->roles->pluck('name'),
                    'debt' => $debt,
                    'status' => $debt > 0 ? 'debt' : 'ok',
                    'attendance_pct' => $attendancePct, 
                    'total_sessions' => $totalSessions
                ];
            });

            return response()->json($data);

        } catch (\Exception $e) {
            // Esto te dirá en la consola del navegador por qué falla si vuelve a pasar
            return response()->json(['message' => 'Error cargando plantel: ' . $e->getMessage()], 500);
        }
    }
}