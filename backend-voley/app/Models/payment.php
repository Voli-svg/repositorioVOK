<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    // Si en tu base de datos la tabla se llama 'payments', no hace falta definir $table.
    // Pero por seguridad lo ponemos:
    protected $table = 'payments';
    
    // Desactivamos timestamps si tu tabla SQL manual no tiene 'updated_at'
    public $timestamps = false; 

    protected $fillable = [
        'user_id',
        'concept',
        'amount',
        'payment_date',
        'status'
    ];

    // Relación: Un pago pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}