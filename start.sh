#!/bin/bash

# 個人化名片製作網頁 - 快速開始指令碼

echo "🎨 個人化名片製作網頁 - 快速開始"
echo "================================"
echo ""

# 檢查 Python
if command -v python3 &> /dev/null; then
    echo "✅ 檢測到 Python 3"
    echo ""
    echo "🚀 啟動本地伺服器..."
    echo "📍 訪問 URL: http://localhost:8000"
    echo ""
    echo "按 Ctrl+C 停止伺服器"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ 檢測到 Python"
    echo ""
    echo "🚀 啟動本地伺服器..."
    echo "📍 訪問 URL: http://localhost:8000"
    echo ""
    echo "按 Ctrl+C 停止伺服器"
    echo ""
    python -m SimpleHTTPServer 8000
else
    echo "⚠️  未找到 Python"
    echo ""
    echo "請安裝 Python 或使用其他方法啟動伺服器:"
    echo ""
    echo "方法 1: Node.js http-server"
    echo "  npm install -g http-server"
    echo "  http-server"
    echo ""
    echo "方法 2: VS Code Live Server 擴充"
    echo "  右鍵點擊 index.html → Open with Live Server"
    echo ""
    echo "方法 3: PHP"
    echo "  php -S localhost:8000"
fi
