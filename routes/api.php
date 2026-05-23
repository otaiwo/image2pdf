<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Tools\ImageToPdfController;

Route::prefix('tools')->middleware(['guest.limit'])->group(function () {
    Route::prefix('image-to-pdf')->group(function () {
        Route::post('/upload', [ImageToPdfController::class, 'upload'])
            ->name('api.tools.image-to-pdf.upload')
            ->middleware(['throttle:60,1', 'rate.limit.uploads']);

        Route::get('/status/{jobId}', [ImageToPdfController::class, 'status'])
            ->name('api.tools.image-to-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [ImageToPdfController::class, 'download'])
            ->name('api.tools.image-to-pdf.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('file-converter')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\FileConverterController::class, 'upload'])
            ->name('api.tools.file-converter.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\FileConverterController::class, 'status'])
            ->name('api.tools.file-converter.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\FileConverterController::class, 'download'])
            ->name('api.tools.file-converter.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('merge-pdf')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\MergePdfController::class, 'upload'])
            ->name('api.tools.merge-pdf.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\MergePdfController::class, 'status'])
            ->name('api.tools.merge-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\MergePdfController::class, 'download'])
            ->name('api.tools.merge-pdf.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('ai')->group(function () {
        Route::post('/summarize', [\App\Http\Controllers\Api\Tools\PdfAiController::class, 'summarize'])
            ->name('api.tools.ai.summarize')
            ->middleware(['throttle:30,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\PdfAiController::class, 'status'])
            ->name('api.tools.ai.status')
            ->middleware(['throttle:120,1']);
    });
});
