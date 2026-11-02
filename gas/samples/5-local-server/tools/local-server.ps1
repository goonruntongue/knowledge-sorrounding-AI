# 「ここにHTMLを置く」フォルダーを http://localhost:8000/ で開けるようにする小さな Web サーバー。
# Windows に最初から入っている PowerShell だけで動き、このパソコンの中からしか見られない。
# 「サーバーを起動（Windows）.bat」から呼び出す。止めるときはウィンドウを閉じるか Ctrl + C。
param([int]$Port = 8000, [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\ここにHTMLを置く'))
$rootWithSep = $root.TrimEnd('\') + '\'

$types = @{
  '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8';  '.js'  = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'
  '.svg'  = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'; '.webp' = 'image/webp'; '.ico' = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host ''
  Write-Host "  $Port 番でサーバーを起動できませんでした。"
  Write-Host '  ほかのソフトが同じ番号を使っていないか確かめてください。'
  Write-Host ''
  exit 1
}

Write-Host ''
Write-Host '  ローカルサーバーを起動しました。'
Write-Host ''
Write-Host '  ブラウザーで次のアドレスを開きます:'
Write-Host "    http://localhost:$Port/"
Write-Host ''
Write-Host '  このパソコンの中からだけ見られます。'
Write-Host '  止めるときは、このウィンドウを閉じてください。'
Write-Host ''
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }

function Send-Text($response, [int]$status, [string]$text) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $response.StatusCode = $status
  $response.ContentType = 'text/plain; charset=utf-8'
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

try {
  while ($listener.IsListening) {
    # 少しずつ待つことで、Ctrl + C で止められるようにする
    $task = $listener.GetContextAsync()
    while (-not $task.Wait(500)) { }
    $context = $task.Result
    $request = $context.Request
    $response = $context.Response
    try {
      $relative = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath).TrimStart('/').Replace('/', '\')
      if ($relative -eq '' -or $relative.EndsWith('\')) { $relative += 'index.html' }
      $path = [System.IO.Path]::GetFullPath((Join-Path $root $relative))

      # 「ここにHTMLを置く」フォルダーの外にあるファイルは渡さない
      if (-not $path.StartsWith($rootWithSep, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Text $response 404 'Not Found'
      } elseif (-not [System.IO.File]::Exists($path)) {
        Send-Text $response 404 'Not Found'
      } else {
        $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
        $response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $response.AddHeader('Cache-Control', 'no-store')
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $response.ContentLength64 = $bytes.Length
        if ($request.HttpMethod -ne 'HEAD') { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
      }
      Write-Host ("  {0}  {1}  {2}" -f (Get-Date -Format 'HH:mm:ss'), $response.StatusCode, $request.Url.AbsolutePath)
    } catch {
      try { Send-Text $response 500 'Error' } catch { }
    } finally {
      $response.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
