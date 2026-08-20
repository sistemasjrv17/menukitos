@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo === KITOS: commit + push ===
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo ERROR: Esta carpeta no es un repositorio git.
  pause
  exit /b 1
)

git status -sb
echo.

rem Mensaje: usa el argumento, o pide uno, o usa fecha/hora
set "MSG=%*"
if "%MSG%"=="" (
  set /p MSG="Mensaje del commit: "
)
if "%MSG%"=="" (
  set "MSG=Update %DATE% %TIME%"
)

git add -A
if errorlevel 1 (
  echo ERROR: falló git add.
  pause
  exit /b 1
)

git diff --cached --quiet
if %errorlevel%==0 (
  echo No hay cambios para commit.
  pause
  exit /b 0
)

echo.
echo Archivos a subir:
git diff --cached --name-only
echo.

echo .env NO se sube (está en .gitignore).
echo.

git commit -m "%MSG%"
if errorlevel 1 (
  echo ERROR: falló el commit. Si pide user.name / user.email, configúralos primero.
  pause
  exit /b 1
)

echo.
git push -u origin HEAD
if errorlevel 1 (
  echo ERROR: falló el push.
  pause
  exit /b 1
)

echo.
echo OK: commit y push listos.
git status -sb
echo.
pause
endlocal
