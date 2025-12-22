<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // <--- 1. IMPORTANTE PARA LOGIN

class User extends Authenticatable
{
    // <--- 2. AGREGA HasApiTokens AQUÍ
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'full_name', // Asegúrate que coincida con tu base de datos
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- 3. ESTA ES LA FUNCIÓN QUE LE FALTA A TU DASHBOARD ---
    // Sin esto, el menú lateral y el dashboard dan error 500
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }
}