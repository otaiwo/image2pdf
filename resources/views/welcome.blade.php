<!DOCTYPE html>
<html>
<head>
    <title>Image to PDF</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>
        body {font-family: Arial, sans-serif; margin: 2rem;}
        #status {margin-top: 1rem;}
        #download {margin-top: 1rem; display:none;}
    </style>
</head>
<body>
    <h1>Image to PDF</h1>
    <input type="file" id="images" multiple accept="image/*" />
    <button onclick="upload()">Convert</button>
    <p id="status"></p>
    <a id="download" href="#" download>Download PDF</a>

    <script>
        async function upload() {
            const files = document.getElementById('images').files;
            if (!files.length) return alert('Select images');

            const form = new FormData();
            for (let f of files) {
                form.append('images[]', f);
            }

            document.getElementById('status').innerText = 'Uploading...';

            const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const res = await fetch('/api/tools/image-to-pdf/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf
                },
                body: form
            });

            const data = await res.json();
            if (!data.success) {
                document.getElementById('status').innerText = data.message || 'Upload failed';
                return;
            }
            poll(data.job_id);
        }

        async function poll(jobId) {
            const statusEl = document.getElementById('status');
            const downloadEl = document.getElementById('download');
            try {
                const res = await fetch(`/api/tools/image-to-pdf/status/${jobId}`);
                const data = await res.json();
                if (data.success) {
                    if (data.data.is_completed) {
                        statusEl.innerText = 'Conversion complete';
                        downloadEl.style.display = 'inline';
                        downloadEl.href = data.data.download_url;
                    } else {
                        statusEl.innerText = `Status: ${data.data.status}`;
                        setTimeout(() => poll(jobId), 2000);
                    }
                } else {
                    statusEl.innerText = data.message || 'Error checking status';
                }
            } catch (e) {
                statusEl.innerText = 'Error: ' + e.message;
            }
        }
    </script>
</body>
</html>
