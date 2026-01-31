@echo off
echo ========================================
echo SCRIPT DE EMERGENCIA - ELIMINAR HACKERS
echo ========================================
echo.
echo Este script eliminara usuarios no autorizados
echo que se auto-asignaron privilegios de super_admin
echo.
echo ADVERTENCIA: Esta accion es IRREVERSIBLE
echo.
pause

node remove-hackers.js

echo.
echo ========================================
echo Proceso completado
echo ========================================
pause
