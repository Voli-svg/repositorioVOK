<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InjuryController extends Controller
{
    // Ver todas las lesiones (Ordenadas por pendientes primero)
    public function index()
    {
        $injuries = DB::table('injuries')
            ->join('users as player', 'injuries.user_id', '=', 'player.id')
            ->leftJoin('users as kine', 'injuries.treated_by', '=', 'kine.id')
            ->select(
                'injuries.*', 
                'player.full_name as player_name', 
                'kine.full_name as kine_name'
            )
            ->orderByRaw("FIELD(status, 'pendiente', 'tratamiento', 'alta')")
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($injuries);
    }

    // Jugador reporta lesión
    public function store(Request $request)
    {
        $request->validate(['title'=>'required', 'description'=>'required', 'user_id'=>'required']);

        $id = DB::table('injuries')->insertGetId([
            'user_id' => $request->user_id,
            'title' => $request->title,
            'description' => $request->description,
            'severity' => $request->severity ?? 'baja',
            'status' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Reporte creado', 'id' => $id]);
    }

    // Kine responde (Actualiza diagnóstico y estado)
    public function update(Request $request, $id)
    {
        DB::table('injuries')->where('id', $id)->update([
            'diagnosis' => $request->diagnosis,
            'status' => $request->status,
            'treated_by' => $request->treated_by, // ID del Kine
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Tratamiento actualizado']);
    }
}