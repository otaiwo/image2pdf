<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\CleanupTempFilesJob;

// Clean up temporary files every hour
Schedule::job(new CleanupTempFilesJob)->hourly();

// Clean up expired job records daily
Schedule::command('model:prune', [
    '--model' => [\App\Models\ToolJob::class],
])->daily();
