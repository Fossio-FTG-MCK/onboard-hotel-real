@echo off
SETLOCAL

SET REMOTE_BRANCH=desenvolvimento
SET COMMIT_MSG="Deploy para desenvolvimento"
IF NOT "%~1"=="" SET COMMIT_MSG=%~1

ECHO.
ECHO Realizando commit na branch atual...
git add .
git commit -m %COMMIT_MSG%

ECHO.
ECHO Enviando conteúdo da branch atual para o remoto: %REMOTE_BRANCH%...
git push origin HEAD:%REMOTE_BRANCH%

ECHO.
ECHO --------------------------------------
ECHO PUSH PARA %REMOTE_BRANCH% FINALIZADO
ECHO --------------------------------------
PAUSE
