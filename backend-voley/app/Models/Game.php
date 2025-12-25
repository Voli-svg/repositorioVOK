<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    // Aquí le decimos: "Aunque me llamo Game, usa la tabla 'matches'"
    protected $table = 'matches';

    // Desactivamos timestamps porque tu tabla SQL no tiene updated_at
    public $timestamps = false;

    protected $fillable = [
        'rival',
        'match_date',
        'match_time',
        'location',
        'status',      
        'score_local',
        'score_visit',
        'sets_detail'
    ];
}