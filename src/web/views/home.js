export function getHomePage(webPort, lifetimeHours) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TikTok Downloader</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }

        .input-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }

        input[type="text"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s;
        }

        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        button {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: #f5f5f5;
            color: #333;
        }

        .btn-secondary:hover {
            background: #e0e0e0;
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }

        #status {
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
            animation: slideIn 0.3s;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .status-loading {
            background: #fff3cd;
            color: #856404;
            border-left: 4px solid #ffc107;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }

        .status-error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }

        #videos {
            margin-top: 30px;
        }

        .video-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            animation: slideIn 0.3s;
        }

        .video-info {
            flex: 1;
        }

        .video-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }

        .video-meta {
            font-size: 14px;
            color: #666;
        }

        .download-btn {
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }

        .download-btn:hover {
            background: #5568d3;
            transform: translateY(-2px);
        }

        .loader {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 TikTok Downloader</h1>
        <p class="subtitle">Téléchargez des vidéos TikTok sans watermark</p>

        <div class="input-group">
            <label for="url">URL ou Username TikTok</label>
            <input type="text" id="url" placeholder="https://www.tiktok.com/@user/video/123... ou @username">
        </div>

        <div class="button-group">
            <button class="btn-primary" onclick="downloadSingle()">📹 Télécharger Vidéo</button>
            <button class="btn-secondary" onclick="downloadUser()">👤 Télécharger Profil</button>
        </div>

        <div id="status"></div>
        <div id="videos"></div>
    </div>

    <script>
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status-' + type;
            status.style.display = 'block';
        }

        function showLoader(message) {
            const status = document.getElementById('status');
            status.innerHTML = '<span class="loader"></span>' + message;
            status.className = 'status-loading';
            status.style.display = 'block';
        }

        async function downloadSingle() {
            const url = document.getElementById('url').value.trim();
            if (!url) {
                showStatus('❌ Veuillez entrer une URL', 'error');
                return;
            }

            showLoader('Téléchargement en cours...');
            document.getElementById('videos').innerHTML = '';

            try {
                const response = await fetch('/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, type: 'single' })
                });

                const data = await response.json();

                if (data.success) {
                    showStatus('✅ Vidéo téléchargée avec succès !', 'success');
                    displayVideo(data.video);
                } else {
                    showStatus('❌ ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Erreur: ' + error.message, 'error');
            }
        }

        async function downloadUser() {
            const input = document.getElementById('url').value.trim().replace('@', '');
            if (!input) {
                showStatus('❌ Veuillez entrer un username', 'error');
                return;
            }

            showLoader('Récupération des vidéos...');
            document.getElementById('videos').innerHTML = '';

            try {
                const response = await fetch('/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: input, type: 'user' })
                });

                const data = await response.json();

                if (data.success) {
                    showStatus(\`✅ \${data.videos.length} vidéo(s) téléchargée(s) !\`, 'success');
                    data.videos.forEach(video => displayVideo(video));
                } else {
                    showStatus('❌ ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Erreur: ' + error.message, 'error');
            }
        }

        function displayVideo(video) {
            const videosDiv = document.getElementById('videos');
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.innerHTML = \`
                <div class="video-info">
                    <div class="video-title">@\${video.author} - \${video.id}</div>
                    <div class="video-meta">\${video.size} | Expire dans ${lifetimeHours}h</div>
                </div>
                <a href="/downloads/\${video.filename}" class="download-btn" download>⬇️ Télécharger</a>
            \`;
            videosDiv.appendChild(videoItem);
        }
    </script>
</body>
</html>
    `;
}