<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        Commands\CleanupExpiredJobs::class,
    ];

    protected function schedule(Schedule $schedule)
    {
        // Clean up expired jobs every hour
        $schedule->command('jobs:cleanup')->hourly();

        // Queue retry every 5 minutes
        $schedule->command('queue:retry all')->everyFiveMinutes();

        // Prune failed jobs daily
        $schedule->command('queue:prune-failed')->daily();
    }

    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
