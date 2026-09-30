# Servidor estático local para o site N1 (sem precisar de Node/Python).
# Uso: powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 5173]
param([int]$Port = 5173)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.json'='application/json'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.svg'='image/svg+xml'
  '.webp'='image/webp'; '.mp4'='video/mp4'; '.webm'='video/webm'; '.mp3'='audio/mpeg'; '.woff2'='font/woff2'; '.ico'='image/x-icon'
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "N1 site em http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = Join-Path $root $path
  $res = $ctx.Response
  try {
    if (Test-Path $file -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = $(if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' })
      $res.Headers.Add('Accept-Ranges', 'bytes')
      $res.Headers.Add('Cache-Control', 'no-store')
      $bytes = [IO.File]::ReadAllBytes($file)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes("404: $path")
      $res.OutputStream.Write($b, 0, $b.Length)
    }
  } catch { } finally { $res.Close() }
}
