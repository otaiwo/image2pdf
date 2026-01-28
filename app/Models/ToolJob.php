<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ToolJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'user_id',
        'type',
        'input_files',
        'output_file',
        'status',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'input_files' => 'array',
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];
}
