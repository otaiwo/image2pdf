<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        .page {
            page-break-after: always;
            text-align: center;
        }
        .page:last-child {
            page-break-after: avoid;
        }
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    @foreach($images as $image)
        <div class="page">
            <img src="{{ $image }}" />
        </div>
    @endforeach
</body>
</html>
