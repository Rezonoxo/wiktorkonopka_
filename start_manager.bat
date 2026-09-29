@echo off
setlocal
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0gallery_manager.py"
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python nie jest zainstalowany lub nie zostal dodany do PATH.
    echo Zainstaluj Python 3.8 lub nowszy, zaznaczajac "Add Python to PATH".
    pause
    exit /b 1
  )
  python "%~dp0gallery_manager.py"
)
if errorlevel 1 pause
