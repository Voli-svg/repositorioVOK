<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    // Obtener posts (Más recientes primero)
    public function index()
    {
        $posts = DB::table('posts')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->select('posts.*', 'users.full_name') // Traemos el nombre del autor
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($posts);
    }

    // Publicar nuevo mensaje
    public function store(Request $request)
    {
        $request->validate(['content' => 'required', 'user_id' => 'required']);

        $id = DB::table('posts')->insertGetId([
            'user_id' => $request->user_id,
            'content' => $request->content,
            'likes_count' => 0,
            'created_at' => now()
        ]);

        // Devolvemos el post completo con el nombre del usuario para mostrarlo al tiro
        $newPost = DB::table('posts')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->select('posts.*', 'users.full_name')
            ->where('posts.id', $id)
            ->first();

        return response()->json($newPost);
    }

    // Dar Like (Incrementar contador)
    public function like($id)
    {
        DB::table('posts')->where('id', $id)->increment('likes_count');
        return response()->json(['message' => 'Liked']);
    }

    // Eliminar post
    public function destroy($id)
    {
        DB::table('posts')->where('id', $id)->delete();
        return response()->json(['message' => 'Eliminado']);
    }
}