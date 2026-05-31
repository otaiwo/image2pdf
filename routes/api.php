<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Tools\ImageToPdfController;
use App\Http\Controllers\Api\AuthController;

Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user'])->name('api.user');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

    Route::prefix('organizations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\OrganizationController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\OrganizationController::class, 'store']);
        Route::get('/{organization}', [\App\Http\Controllers\Api\OrganizationController::class, 'show']);
    });
});

Route::get('/dashboard/recent-activity', [\App\Http\Controllers\Api\DashboardController::class, 'recentActivity'])
    ->name('api.dashboard.recent-activity');

Route::get('/admin/stats', [\App\Http\Controllers\Api\AdminDashboardController::class, 'stats'])
    ->name('api.admin.stats');

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

    Route::prefix('split-pdf')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\SplitPdfController::class, 'upload'])
            ->name('api.tools.split-pdf.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\SplitPdfController::class, 'status'])
            ->name('api.tools.split-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\SplitPdfController::class, 'download'])
            ->name('api.tools.split-pdf.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('watermark-pdf')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\WatermarkPdfController::class, 'upload'])
            ->name('api.tools.watermark-pdf.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\WatermarkPdfController::class, 'status'])
            ->name('api.tools.watermark-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\WatermarkPdfController::class, 'download'])
            ->name('api.tools.watermark-pdf.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('protect-pdf')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\ProtectPdfController::class, 'upload'])
            ->name('api.tools.protect-pdf.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\ProtectPdfController::class, 'status'])
            ->name('api.tools.protect-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\ProtectPdfController::class, 'download'])
            ->name('api.tools.protect-pdf.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('unlock-pdf')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\UnlockPdfController::class, 'upload'])
            ->name('api.tools.unlock-pdf.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\UnlockPdfController::class, 'status'])
            ->name('api.tools.unlock-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\UnlockPdfController::class, 'download'])
            ->name('api.tools.unlock-pdf.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('organize-pdf')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\OrganizePdfController::class, 'upload'])
            ->name('api.tools.organize-pdf.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\OrganizePdfController::class, 'status'])
            ->name('api.tools.organize-pdf.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\OrganizePdfController::class, 'download'])
            ->name('api.tools.organize-pdf.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('edit-metadata')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\PdfMetadataController::class, 'upload'])
            ->name('api.tools.edit-metadata.upload')
            ->middleware(['throttle:60,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\PdfMetadataController::class, 'status'])
            ->name('api.tools.edit-metadata.status')
            ->middleware(['throttle:120,1']);

        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\PdfMetadataController::class, 'download'])
            ->name('api.tools.edit-metadata.download')
            ->middleware(['throttle:30,1']);
    });

    Route::prefix('web-to-pdf')->group(function () {
        Route::post('/url', [\App\Http\Controllers\Api\Tools\WebToPdfController::class, 'convertUrl'])
            ->name('api.tools.web-to-pdf.url');
        Route::post('/html', [\App\Http\Controllers\Api\Tools\WebToPdfController::class, 'convertHtml'])
            ->name('api.tools.web-to-pdf.html');
        Route::post('/markdown', [\App\Http\Controllers\Api\Tools\WebToPdfController::class, 'convertMarkdown'])
            ->name('api.tools.web-to-pdf.markdown');
        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\WebToPdfController::class, 'status'])
            ->name('api.tools.web-to-pdf.status');
        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\WebToPdfController::class, 'download'])
            ->name('api.tools.web-to-pdf.download');
    });

    Route::prefix('pdf-to-image')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\PdfToImageController::class, 'upload'])
            ->name('api.tools.pdf-to-image.upload');
        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\PdfToImageController::class, 'status'])
            ->name('api.tools.pdf-to-image.status');
        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\PdfToImageController::class, 'download'])
            ->name('api.tools.pdf-to-image.download');
    });

    Route::prefix('compress-pdf')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\Tools\CompressPdfController::class, 'upload'])
            ->name('api.tools.compress-pdf.upload');
        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\CompressPdfController::class, 'status'])
            ->name('api.tools.compress-pdf.status');
        Route::get('/download/{jobId}', [\App\Http\Controllers\Api\Tools\CompressPdfController::class, 'download'])
            ->name('api.tools.compress-pdf.download');
    });

    Route::prefix('ai')->group(function () {
        Route::post('/summarize', [\App\Http\Controllers\Api\Tools\PdfAiController::class, 'summarize'])
            ->name('api.tools.ai.summarize')
            ->middleware(['throttle:30,1']);

        Route::post('/keywords', [\App\Http\Controllers\Api\Tools\PdfAiController::class, 'extractKeywords'])
            ->name('api.tools.ai.keywords')
            ->middleware(['throttle:30,1']);

        Route::post('/translate', [\App\Http\Controllers\Api\Tools\PdfAiController::class, 'translate'])
            ->name('api.tools.ai.translate')
            ->middleware(['throttle:30,1']);

        Route::get('/status/{jobId}', [\App\Http\Controllers\Api\Tools\PdfAiController::class, 'status'])
            ->name('api.tools.ai.status')
            ->middleware(['throttle:120,1']);

        Route::prefix('chat')->group(function () {
            Route::post('/upload', [\App\Http\Controllers\Api\Tools\PdfChatController::class, 'upload'])
                ->name('api.tools.ai.chat.upload');
            Route::post('/{jobId}/ask', [\App\Http\Controllers\Api\Tools\PdfChatController::class, 'ask'])
                ->name('api.tools.ai.chat.ask');
        });
    });
});
