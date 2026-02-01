@echo off
REM 個人化名片製作網頁 - Windows 快速開始指令碼

echo.
echo 🎨 個人化名片製作網頁 - 快速開始
echo ================================
echo.

REM 檢查 Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 檢測到 Python
    echo.
    echo 🚀 啟動本地伺服器...
    echo 📍 訪問 URL: http://localhost:8000
    echo.
    echo 按 Ctrl+C 停止伺服器
    echo.
    python -m http.server 8000
    goto end
)

REM 檢查 Python 3
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 檢測到 Python 3
    echo.
    echo 🚀 啟動本地伺服器...
    echo 📍 訪問 URL: http://localhost:8000
    echo.
    echo 按 Ctrl+C 停止伺服器
    echo.
    python3 -m http.server 8000
    goto end
)

REM 未找到 Python
echo ⚠️  未找到 Python
echo.
echo 請安裝 Python 或使用其他方法啟動伺服器:
echo.
echo 方法 1: Node.js http-server
echo   npm install -g http-server
echo   http-server
echo.
echo 方法 2: VS Code Live Server 擴充
echo   右鍵點擊 index.html 選擇 Open with Live Server
echo.

:end
pause
