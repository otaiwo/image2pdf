<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\ImageToPdfController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Main converter page
Route::get('/', [ImageToPdfController::class, 'index'])->name('home');

// Web download route
Route::get('/download/{jobId}', [ImageToPdfController::class, 'download'])
    ->name('pdf.download');

// Progress tracking endpoint for web
Route::get('/progress/{jobId}', [ImageToPdfController::class, 'status'])
    ->name('pdf.progress');

// Catch-all for React Router SPA
Route::get('/{any}', [ImageToPdfController::class, 'index'])
    ->where('any', '^(?!api|storage).*$');
