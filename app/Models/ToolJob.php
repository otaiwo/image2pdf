<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Prunable;

class ToolJob extends Model
{
    use HasFactory, Prunable;

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

    /**
     * Prune completed/failed jobs older than 7 days.
     */
    public function prunable()
    {
        return static::whereIn('status', ['completed', 'failed'])
            ->where('updated_at', '<', now()->subDays(7));
    }
}
