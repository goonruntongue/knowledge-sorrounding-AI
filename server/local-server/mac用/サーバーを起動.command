#!/bin/bash
# Finder からダブルクリックして使うローカル Web サーバーです。
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEBROOT="$SCRIPT_DIR/public_html"
BASE_PORT=8123
LAST_PORT=8223

if [ ! -d "$WEBROOT" ]; then
  echo
  echo "[エラー] public_html フォルダーが見つかりません。"
  echo
  read -r -n 1 -s -p "何かキーを押して閉じてください。"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo
  echo "[エラー] Python 3 が見つかりません。"
  echo "macOS でこのローカルサーバーを使うには Python 3 が必要です。"
  echo "Python の公式サイト https://www.python.org/downloads/macos/ から"
  echo "Python 3 を入れてから、もう一度このファイルを開いてください。"
  echo
  read -r -n 1 -s -p "何かキーを押して閉じてください。"
  exit 1
fi

PORT=""
for ((candidate=BASE_PORT; candidate<=LAST_PORT; candidate++)); do
  if ! lsof -nP -iTCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1; then
    PORT="$candidate"
    break
  fi
done

if [ -z "$PORT" ]; then
  echo
  echo "[エラー] 8123〜8223 番ポートがすべて使用中です。"
  echo "ほかのローカルサーバーを終了してから、もう一度実行してください。"
  echo
  read -r -n 1 -s -p "何かキーを押して閉じてください。"
  exit 1
fi

HOST_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$HOST_IP" ]; then
  HOST_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [ -z "$HOST_IP" ]; then
  HOST_IP="127.0.0.1"
fi

echo
echo "---------------------------------------------"
echo "ローカルサーバーを起動しています…"
echo "公開フォルダー: $WEBROOT"
echo "このMac:        http://localhost:$PORT/"
echo "同じWi-Fi内:    http://$HOST_IP:$PORT/"
echo "---------------------------------------------"
echo
echo "ブラウザーを開きました。終了するには Control + C を押してください。"

open "http://localhost:$PORT/"
exec python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$WEBROOT"
