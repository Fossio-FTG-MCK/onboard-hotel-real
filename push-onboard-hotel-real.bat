@echo off
cd /d %~dp0
echo.
echo [ Git Config + Push FORÇADO - onboard-hotel-real ]
echo --------------------------------------------------
git init
git config user.name "Hyzy-io"
git config user.email "desenvolvimento@hyzy.com.br"
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Fossio-FTG-MCK/onboard-hotel-real.git
git add .
set /p msg="Mensagem do commit: "
git commit -m "%msg%"
git branch -M main
git push origin main --force
echo.
echo [✔] Push forçado finalizado para onboard-hotel-real ]
pause
