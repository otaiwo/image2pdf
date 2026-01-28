<!DOCTYPE html>
<html>

<head>
    <title>Image to PDF</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>

<body>
    <h1>Image to PDF</h1>

    <input type="file" id="images" multiple accept="image/*" />
    <button onclick="upload()">Convert</button>

    <p id="status"></p>
    <a id="download" style="display:none;">Download PDF</a>

    <script>
        async function upload() {
            const files = document.getElementById('images').files;
            if (!files.length) return alert('Select images');

            const form = new FormData();
            for (let f of files) form.append('images[]', f);

            document.getElementById('status').innerText = 'Uploading...';

            const res = await fetch('/api/tools/image-to-pdf', {
                method: 'POST',
                body: form
            });

            const data = await res.json();
            poll(data.job_id);
        }

        async function poll(jobId) {
            const status = document.getElementById('status');
            const download = document.getElementById('download');

            const interval = setInterval(async () => {
                const res = await fetch(`/api/tools/image-to-pdf/${jobId}`);
                const data = await res.json();

                status.innerText = `Status: ${data.status}`;

                if (data.downloadable) {
                    clearInterval(interval);
                    download.href = `/api/tools/image-to-pdf/${jobId}/download`;
                    download.style.display = 'block';
                    download.innerText = 'Download PDF';
                }

                if (data.status === 'failed') {
                    clearInterval(interval);
                    status.innerText = 'Conversion failed';
                }
            }, 2000);
        }
    </script>
</body>

</html>