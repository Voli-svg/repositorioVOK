<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inventory; // <--- Importante: Importar el modelo

class InventoryController extends Controller
{
    public function index()
    {
        // Obtener todos los items de la tabla
        $items = Inventory::all();
        
        // Devolverlos como JSON (formato que entiende React)
        return response()->json($items);
    }

    // Función para guardar un nuevo ítem
    public function store(Request $request)
    {
        // 1. Validar que los datos vengan bien
        $request->validate([
            'item_name' => 'required',
            'quantity' => 'required|integer',
            'category' => 'nullable',
            // Puedes agregar más validaciones si quieres
        ]);

        // 2. Crear y guardar en la Base de Datos
        $item = Inventory::create($request->all());

        // 3. Responder a React con el ítem creado (para confirmación)
        return response()->json($item, 201);
    }

    public function update(Request $request, $id)
    {
    $item = Inventory::find($id);
    
    if (!$item) {
        return response()->json(['message' => 'Ítem no encontrado'], 404);
    }

    // Validamos y actualizamos
    $item->update($request->all());
    
    return response()->json($item);
    }

// Función para BORRAR (DELETE)
public function destroy($id)
    {
    $item = Inventory::find($id);
    
    if (!$item) {
        return response()->json(['message' => 'Ítem no encontrado'], 404);
    }

    $item->delete();
    
    return response()->json(['message' => 'Ítem eliminado']);
    }
}