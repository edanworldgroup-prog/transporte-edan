@echo off
title Transporte Edan - Servidor
cd /d "%~dp0"
echo ===================================================
echo     TRANSPORTE EDAN - SISTEMA DE CONTROL
echo ===================================================
echo Abriendo aplicacion en tu navegador...
timeout /t 2 /nobreak >nul
start http://localhost:3000
npm run start
pause
