#!/bin/bash
# このファイルを実行すると、「ここにHTMLを置く」フォルダーを
# http://localhost:8000/ で開けるようにします。止めるときは control + C を押します。
# Mac に入っている Python 3 で動き、このMacの中からしか見られません。
cd "$(dirname "$0")" || exit 1
PORT=8000

if ! python3 -c 'import http.server' >/dev/null 2>&1; then
  echo ""
  echo "  Python 3 が見つかりません。"
  echo "  「コマンドライン・デベロッパ・ツール」のインストールを求められたら、"
  echo "  インストールしてから、もう一度実行してください。"
  read -r -p "  return キーを押すと閉じます。" _
  exit 1
fi

echo ""
echo "  ローカルサーバーを起動しました。"
echo ""
echo "  ブラウザーで次のアドレスを開きます:"
echo "    http://localhost:$PORT/"
echo ""
echo "  このMacの中からだけ見られます。"
echo "  止めるときは、control キーを押しながら C を押してから、ウィンドウを閉じてください。"
echo ""

(sleep 1; open "http://localhost:$PORT/") &
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "ここにHTMLを置く"
