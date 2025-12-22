<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    // VER TODOS LOS PARTIDOS
    public function index()
    {
        // Ordenamos: Primero los pendientes (para ver lo próximo), luego los jugados recientes
        $matches = DB::table('matches')
            ->orderByRaw("FIELD(status, 'upcoming', 'finished')")
            ->orderBy('match_date', 'asc') // Los próximos primero
            ->get();
        return response()->json($matches);
    }

    // CREAR PARTIDO (Solo Entrenador/Admin)
    public function store(Request $request)
    {
        $request->validate([
            'opponent' => 'required',
            'match_date' => 'required|date',
            'location' => 'required'
        ]);

        DB::table('matches')->insert([
            'opponent' => $request->opponent,
            'match_date' => $request->match_date,
            'location' => $request->location,
            'type' => $request->type ?? 'liga',
            'status' => 'upcoming', // Nace como pendiente
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Partido programado']);
    }

    // ACTUALIZAR RESULTADO (Solo Entrenador/Admin)
    public function update(Request $request, $id)
    {
        // Si mandamos 'our_set_score', asumimos que el partido terminó
        $updateData = [
            'updated_at' => now()
        ];

        if ($request->has('our_set_score')) {
            $updateData['our_set_score'] = $request->our_set_score;
            $updateData['opp_set_score'] = $request->opp_set_score;
            $updateData['status'] = 'finished'; // Se marca como finalizado
        } else {
            // Edición normal (cambiar fecha o rival)
            if($request->opponent) $updateData['opponent'] = $request->opponent;
            if($request->match_date) $updateData['match_date'] = $request->match_date;
            if($request->location) $updateData['location'] = $request->location;
        }

        DB::table('matches')->where('id', $id)->update($updateData);

        return response()->json(['message' => 'Partido actualizado']);
    }

    // BORRAR PARTIDO
    public function destroy($id)
    {
        DB::table('matches')->where('id', $id)->delete();
        return response()->json(['message' => 'Partido eliminado']);
    }
}