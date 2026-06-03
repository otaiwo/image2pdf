<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Pdf\PdfImageDetectionService;
use App\Services\Pdf\FileUploadValidationService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register PDF analysis services
        $this->app->singleton(PdfImageDetectionService::class, function ($app) {
            return new PdfImageDetectionService();
        });

        $this->app->singleton(FileUploadValidationService::class, function ($app) {
            return new FileUploadValidationService(
                $app->make(PdfImageDetectionService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
