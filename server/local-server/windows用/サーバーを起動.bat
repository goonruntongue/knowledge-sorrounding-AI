@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title ローカルサーバー

rem このバッチと同じフォルダーにある public_html を公開します。
set "ROOT=%~dp0"
set "WEBROOT=%ROOT%public_html"
set "SERVER=%ROOT%miniweb.exe"
set "BASE_PORT=8123"
set "LAST_PORT=8223"

if not exist "%SERVER%" (
    echo.
    echo [エラー] miniweb.exe が見つかりません。
    echo このファイル、miniweb.exe、public_html は同じフォルダーに置いてください。
    echo.
    pause
    exit /b 1
)

if not exist "%WEBROOT%\" (
    echo.
    echo [エラー] public_html フォルダーが見つかりません。
    echo.
    pause
    exit /b 1
)

rem 利用できるポートを 8123 から 8223 の範囲で探します。
set "PORT="
for /l %%P in (%BASE_PORT%,1,%LAST_PORT%) do (
    powershell -NoProfile -Command "$busy = Get-NetTCPConnection -State Listen -LocalPort %%P -ErrorAction SilentlyContinue; if ($busy) { exit 0 } else { exit 1 }" >nul 2>&1
    if errorlevel 1 (
        set "PORT=%%P"
        goto :port_found
    )
)

echo.
echo [エラー] 8123〜8223 番ポートがすべて使用中です。
echo ほかのローカルサーバーを終了してから、もう一度実行してください。
echo.
pause
exit /b 1

:port_found
set "IP_FILE=%TEMP%\miniweb-ip-%RANDOM%%RANDOM%.txt"
powershell -NoProfile -Command "$ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.InterfaceAlias -notlike 'vEthernet*' } | Sort-Object InterfaceMetric | Select-Object -First 1 -ExpandProperty IPAddress; if ($ip) { $ip } else { '127.0.0.1' }" > "%IP_FILE%"
set "HOST_IP=127.0.0.1"
if exist "%IP_FILE%" set /p HOST_IP=<"%IP_FILE%"
if exist "%IP_FILE%" del "%IP_FILE%" >nul 2>&1

echo.
echo ---------------------------------------------
echo ローカルサーバーを起動しています…
echo 公開フォルダー: %WEBROOT%
echo このPC:        http://localhost:%PORT%/
echo 同じWi-Fi内:    http://%HOST_IP%:%PORT%/
echo ---------------------------------------------

start "MiniWeb ローカルサーバー" /B "%SERVER%" -r "%WEBROOT%" -p %PORT%
timeout /t 1 /nobreak >nul

rem 起動直後にページが返せることを確認します。
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%PORT%/' -TimeoutSec 5; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 }; exit 1 } catch { exit 1 }"
if errorlevel 1 (
    echo.
    echo [エラー] サーバーを起動できませんでした。
    echo miniweb.exe が Windows Defender により止められていないか確認してください。
    echo.
    pause
    exit /b 1
)

start "" "http://localhost:%PORT%/"
echo.
echo 起動できました。ブラウザーを開きました。
echo 同じWi-Fiの端末から開く場合だけ、Windows Defender の確認画面では
echo 「プライベート ネットワーク」のみを許可してください。
echo 終了するには、この画面で Ctrl+C を押してください。
echo.
pause
endlocal
