<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // <--- ESTO ES VITAL. Si falta, da Error 500.

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user(); // Obtenemos el usuario actual
            
            // Definimos quiénes son los "Jefes" que pueden ver todo
            // Asegúrate de que los slugs coincidan con tu base de datos
            $isBoss = $user->roles()->whereIn('slug', ['admin', 'coach', 'super_admin', 'finance'])->exists();

            $query = DB::table('payments')
                ->join('users', 'payments.user_id', '=', 'users.id')
                ->select('payments.*', 'users.full_name');

            // --- FILTRO DE SEGURIDAD ---
            // Si NO es jefe, forzamos a ver solo SU propia información
            if (!$isBoss) {
                $query->where('payments.user_id', $user->id);
            }

            // --- FILTROS VISUALES ---
            
            // 1. Filtro por Nombre (Solo útil para jefes)
            if ($isBoss && $request->has('search') && $request->search != '') {
                $query->where('users.full_name', 'like', '%' . $request->search . '%');
            }

            // 2. Filtro por Mes (Disponible para todos)
            if ($request->has('month') && $request->month != '') {
                $query->where('payments.due_date', 'like', $request->month . '%');
            }

            $payments = $query
                ->orderBy('payments.status', 'desc') // Pendientes primero
                ->orderBy('payments.due_date', 'desc') // Fechas recientes primero
                ->get();

            return response()->json($payments);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al leer pagos: ' . $e->getMessage()], 500);
        }
    }
    public function byUser($userId)
    {
        try {
            $payments = DB::table('payments')
                ->where('user_id', $userId)
                ->orderBy('due_date', 'desc')
                ->get();
            return response()->json($payments);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error buscando usuario: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required',
                'amount' => 'required|numeric',
                'details' => 'required', // <--- CAMBIO AQUÍ
                'due_date' => 'required|date'
            ]);

            DB::table('payments')->insert([
                'user_id' => $request->user_id,
                'amount' => $request->amount,
                'details' => $request->details, // <--- CAMBIO AQUÍ
                'due_date' => $request->due_date,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json(['message' => 'Cobro asignado correctamente']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }
    public function pay($id)
    {
        try {
            $payment = DB::table('payments')->where('id', $id)->first();
            if (!$payment) return response()->json(['message' => 'Pago no encontrado'], 404);

            $newStatus = ($payment->status === 'pending') ? 'paid' : 'pending';

            DB::table('payments')->where('id', $id)->update([
                'status' => $newStatus,
                'updated_at' => now()
            ]);

            return response()->json(['message' => 'Estado actualizado', 'new_status' => $newStatus]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }
}