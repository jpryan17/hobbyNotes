@echo off
title MaxCalc Live Public Tunnel
cd /d "%~dp0"
python MaximaMiner\run_tunnel.py
if errorlevel 1 (
    echo.
    echo An error occurred. Press any key to exit.
    pause >nul
)
