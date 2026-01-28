<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tools\Web\ImageToPdfController;

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
Route::get('/', function () {
    return view('converter');
});

// Web download route - uses the same controller as API
Route::get('/download/{jobId}', [ImageToPdfController::class, 'download'])
    ->name('pdf.download');
// Remove middleware('signed') for now to simplify

// Progress tracking endpoint for web (optional - you can use the API endpoint directly)
Route::get('/api/tools/image-to-pdf/progress/{jobId}', [ImageToPdfController::class, 'status'])
    ->name('pdf.progress');

// Catch-all for React Router SPA
// This should be the LAST route
Route::get('/{any}', function () {
    return view('converter');
})->where('any', '^(?!api|storage).*$');
