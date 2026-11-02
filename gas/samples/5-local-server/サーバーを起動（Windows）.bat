@echo off
rem このファイルをダブルクリックすると、「ここにHTMLを置く」フォルダーを
rem http://localhost:8000/ で開けるようにします。止めるときはこの画面を閉じます。
rem サーバーの中身は tools\local-server.ps1 です（Windows の PowerShell で動きます）。
cd /d "%~dp0"
title ローカルサーバー（止めるときはこの画面を閉じる）
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\local-server.ps1" -Port 8000 %*
echo.
echo   サーバーが止まりました。何かキーを押すと、この画面を閉じます。
pause > nul
