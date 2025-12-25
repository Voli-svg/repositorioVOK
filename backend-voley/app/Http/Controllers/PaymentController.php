<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user(); 
            
            // Verificamos si es jefe (admin, coach, etc.)
            $isBoss = $user->roles()->whereIn('slug', ['admin', 'coach', 'super_admin', 'finance'])->exists();

            $query = DB::table('payments')
                ->join('users', 'payments.user_id', '=', 'users.id')
                ->select('payments.*', 'users.full_name');

            // --- FILTRO DE SEGURIDAD ---
            if (!$isBoss) {
                $query->where('payments.user_id', $user->id);
            }

            // --- FILTROS VISUALES ---
            if ($isBoss && $request->has('search') && $request->search != '') {
                $query->where('users.full_name', 'like', '%' . $request->search . '%');
            }

            if ($request->has('month') && $request->month != '') {
                $query->where('payments.payment_date', 'like', $request->month . '%');
            }

            $payments = $query
                ->orderBy('payments.status', 'desc') 
                ->orderBy('payments.payment_date', 'desc')
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
                ->orderBy('payment_date', 'desc')
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
                'concept' => 'required',
                'payment_date' => 'required|date'
            ]);

            // --- CORRECCIÓN AQUÍ ---
            // Hemos quitado 'created_at' porque tu tabla no tiene esa columna.
            DB::table('payments')->insert([
                'user_id' => $request->user_id,
                'amount' => $request->amount,
                'concept' => $request->concept,
                'payment_date' => $request->payment_date,
                'status' => 'pending'
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
                'status' => $newStatus
            ]);

            return response()->json(['message' => 'Estado actualizado', 'new_status' => $newStatus]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }
}