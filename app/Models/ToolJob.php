<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ToolJob extends Model
{
    use HasFactory, Prunable, SoftDeletes;

    protected $fillable = [
        'job_id',
        'user_id',
        'organization_id',
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
        'deleted_at' => 'datetime',
    ];

    /**
     * Prune completed/failed jobs older than 7 days.
     */
    public function prunable()
    {
        return static::whereIn('status', ['completed', 'failed'])
            ->where('updated_at', '<', now()->subDays(7));
    }

    /**
     * Get the user that owns this job.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the organization this job belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope query to only user's jobs with authorization.
     */
    public function scopeUserJobs(Builder $query, ?int $userId)
    {
        return $userId ? $query->where('user_id', $userId) : $query->whereNull('user_id');
    }

    /**
     * Scope query to filter by status.
     */
    public function scopeByStatus(Builder $query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if job is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if job is processing.
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    /**
     * Check if job failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}

