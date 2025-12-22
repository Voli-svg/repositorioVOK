<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // <--- VITAL: Sin esto falla el DB::table
use App\Models\User;               // <--- VITAL: Sin esto falla User::where...

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $date = $request->query('date', date('Y-m-d'));

            // Obtener usuarios (Jugadores y Entrenadores)
            $users = User::whereHas('roles', function($q){
                $q->whereIn('slug', ['player', 'coach']);
            })->orderBy('full_name')->get();

            // Obtener asistencia existente
            $attendances = DB::table('attendances')->where('date', $date)->get()->keyBy('user_id');

            $list = $users->map(function($user) use ($attendances) {
                return [
                    'user_id' => $user->id,
                    'full_name' => $user->full_name,
                    'status' => isset($attendances[$user->id]) ? $attendances[$user->id]->status : 'absent'
                ];
            });

            return response()->json($list);

        } catch (\Exception $e) {
            // Esto nos ayudará a ver el error real si sigue fallando
            return response()->json(['error' => $e->getMessage()], 500);
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
                DB::table('attendances')->updateOrInsert(
                    ['user_id' => $record['user_id'], 'date' => $request->date],
                    ['status' => $record['status'], 'updated_at' => now()]
                );
            }

            return response()->json(['message' => 'Guardado']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}