<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory'; // Asegúrate que apunte a tu tabla

    // ESTA ES LA LÍNEA MÁGICA QUE TE FALTA:
    public $timestamps = false;

    protected $fillable = [
        'item_name', 
        'category', 
        'quantity', 
        'condition_status', 
        'assigned_to',
        'last_check_date'
    ];
}