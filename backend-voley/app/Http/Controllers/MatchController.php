<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    // VER TODOS LOS PARTIDOS
    public function index()
    {
        try {
            // Ordenamos: Primero los programados, luego los finalizados
            // Y ordenamos por fecha y HORA (match_time es vital)
            $matches = DB::table('matches')
                ->orderByRaw("FIELD(status, 'scheduled', 'finished', 'cancelled')")
                ->orderBy('match_date', 'asc')
                ->orderBy('match_time', 'asc')
                ->get();
                
            return response()->json($matches);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al cargar partidos: ' . $e->getMessage()], 500);
        }
    }

    // CREAR PARTIDO (Solo Entrenador/Admin)
    public function store(Request $request)
    {
        try {
            $request->validate([
                'rival' => 'required',        // <--- CAMBIO: opponent -> rival
                'match_date' => 'required|date',
                'match_time' => 'required',   // <--- VITAL: Faltaba este campo
                'location' => 'required'
            ]);

            DB::table('matches')->insert([
                'rival' => $request->rival,          // <--- CAMBIO: rival
                'match_date' => $request->match_date,
                'match_time' => $request->match_time,// <--- CAMBIO: match_time
                'location' => $request->location,
                'status' => 'scheduled',             // <--- CAMBIO: upcoming -> scheduled (según tu SQL)
                'score_local' => 0,
                'score_visit' => 0,
                'created_at' => now()
                // Quitamos 'type' y 'updated_at' porque no existen en tu tabla SQL original
            ]);

            return response()->json(['message' => 'Partido programado exitosamente']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error creando partido: ' . $e->getMessage()], 500);
        }
    }

    // ACTUALIZAR RESULTADO O EDITAR
    public function update(Request $request, $id)
    {
        try {
            $updateData = []; // Array vacío para llenar solo lo que cambie

            // CASO 1: Estamos finalizando el partido (Poniendo marcador)
            if ($request->has('score_local') || $request->has('score_visit')) {
                $updateData['score_local'] = $request->score_local ?? 0; // <--- CAMBIO: our_set_score -> score_local
                $updateData['score_visit'] = $request->score_visit ?? 0; // <--- CAMBIO: opp_set_score -> score_visit
                
                if ($request->has('sets_detail')) {
                    $updateData['sets_detail'] = $request->sets_detail;
                }
                
                $updateData['status'] = 'finished';
            } 
            // CASO 2: Edición normal (cambiar fecha, hora o rival antes del partido)
            else {
                if($request->rival) $updateData['rival'] = $request->rival;
                if($request->match_date) $updateData['match_date'] = $request->match_date;
                if($request->match_time) $updateData['match_time'] = $request->match_time;
                if($request->location) $updateData['location'] = $request->location;
            }

            DB::table('matches')->where('id', $id)->update($updateData);

            return response()->json(['message' => 'Partido actualizado']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error actualizando: ' . $e->getMessage()], 500);
        }
    }

    // BORRAR PARTIDO
    public function destroy($id)
    {
        DB::table('matches')->where('id', $id)->delete();
        return response()->json(['message' => 'Partido eliminado']);
    }
}