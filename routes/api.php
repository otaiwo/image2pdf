<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Tools\ImageToPdfController;

Route::prefix('tools')->group(function () {
    Route::prefix('image-to-pdf')->group(function () {
        Route::post('/upload', [ImageToPdfController::class, 'upload'])
            ->name('api.tools.image-to-pdf.upload')
            ->middleware(['throttle:60,1', 'cors', 'rate.limit.uploads']);

        Route::get('/status/{jobId}', [ImageToPdfController::class, 'status'])
            ->name('api.tools.image-to-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [ImageToPdfController::class, 'download'])
            ->name('api.tools.image-to-pdf.download')
            ->middleware(['throttle:30,1']);
    });
});
