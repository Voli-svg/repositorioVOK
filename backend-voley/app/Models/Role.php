<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    // No usamos timestamps (created_at) en esta tabla
    public $timestamps = false;
    
    // Campos que permitimos llenar
    protected $fillable = ['name', 'slug', 'description'];
}