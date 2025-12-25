<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $date = $request->query('date', date('Y-m-d'));

            // 1. Usuarios (excluyendo super admin)
            $users = User::whereDoesntHave('roles', function($q){
                $q->where('slug', 'super_admin');
            })->orderBy('full_name')->get();

            // 2. Asistencia del día
            $attendances = DB::table('attendances')
                ->where('date', $date)
                ->get()
                ->keyBy('user_id');

            // 3. Cruzar datos
            $list = $users->map(function($user) use ($attendances) {
                $record = $attendances[$user->id] ?? null;
                return [
                    'user_id' => $user->id,
                    'full_name' => $user->full_name,
                    // Si no hay registro, enviamos null
                    'status' => $record ? $record->status : null, 
                    'remarks' => $record ? $record->remarks : ''
                ];
            });

            return response()->json($list);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'date' => 'required|date',
                'attendances' => 'required|array'
            ]);

            foreach ($request->attendances as $record) {
                // TRUCO: Aseguramos que el status sea válido para la DB
                // Si el frontend envía null o vacío, lo saltamos o ponemos 'absent'
                if (empty($record['status'])) continue;

                DB::table('attendances')->updateOrInsert(
                    ['user_id' => $record['user_id'], 'date' => $request->date],
                    [
                        'status' => $record['status'], // Debe ser 'present', 'absent' o 'justified'
                        'remarks' => $record['remarks'] ?? null
                        // IMPORTANTE: NO ponemos 'updated_at' ni 'created_at' aquí
                        // porque updateOrInsert con DB::table no lo maneja bien si la tabla es simple
                    ]
                );
            }

            return response()->json(['message' => 'Asistencia guardada correctamente']);

        } catch (\Exception $e) {
            // Este mensaje te dirá exactamente qué columna falta o qué dato está mal
            return response()->json(['message' => 'Error al guardar: ' . $e->getMessage()], 500);
        }
    }
}