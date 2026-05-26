<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Image to PDF Converter') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])

    <style>
        [x-cloak] {
            display: none !important;
        }

        .drop-zone {
            border: 3px dashed #ccc;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .drop-zone:hover,
        .drop-zone.dragover {
            border-color: #4f46e5;
            background-color: #f8fafc;
        }
    </style>
</head>

<body class="font-sans antialiased bg-gray-50 dark:bg-gray-950">
    <div id="app"></div>
</body>

</html>