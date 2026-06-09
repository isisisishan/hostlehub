# HostelHub Local PowerShell Web Server
# Serves the static files (HTML, CSS, JS) locally on port 8080

$port = 8080
$hostAddress = "127.0.0.1"

# Initialize HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://$hostAddress`:$port/")

try {
    $listener.Start()
    Write-Host "HostelHub server successfully started!"
    Write-Host "Local URL: http://$hostAddress`:$port/"
    Write-Host "Press Ctrl+C in your terminal to stop the server."
    Write-Host "--------------------------------------------------"
} catch {
    Write-Error "Failed to start listener on port $port. The port might be in use or permissions are restricted. Details: $_"
    exit 1
}

# Define basic MIME types
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

# Serve requests loop
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Clean URL paths
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") {
            $localPath = "/index.html"
        }

        # Prevent directory traversal attacks
        if ($localPath.Contains("..")) {
            $response.StatusCode = 403
            $response.ContentType = "text/plain"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # Map to physical directory path
        $filePath = Join-Path $PSScriptRoot $localPath.Substring(1)

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$ext]
            if ($null -eq $contentType) {
                $contentType = "application/octet-stream"
            }

            $response.ContentType = $contentType
            $response.StatusCode = 200

            # Read and write file content bytes
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            # 404 Not Found Page
            $response.StatusCode = 404
            $response.ContentType = "text/html; charset=utf-8"
            $errHtml = "<html><body><h1>404 File Not Found</h1><p>The file '$localPath' was not found on this server.</p></body></html>"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($errHtml)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }

        $response.Close()
    }
} catch {
    Write-Host "Server encountered an error or was stopped: $_"
} finally {
    $listener.Stop()
    Write-Host "HostelHub server stopped."
}
