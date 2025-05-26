@echo off
SETLOCAL

REM Nome da branch de desenvolvimento
SET BRANCH=desenvolvimento

REM Mensagem de commit padrão, pode ser alterada via argumento
SET COMMIT_MSG="Atualização automática para desenvolvimento"
IF NOT "%~1"=="" SET COMMIT_MSG=%~1

ECHO.
ECHO Mudando para a branch %BRANCH%...
git checkout %BRANCH%

ECHO.
ECHO Atualizando repositório local...

git add .

ECHO.
ECHO Fazendo commit...
git commit -m %COMMIT_MSG%

ECHO.
ECHO Realizando push para a branch %BRANCH%...
git push origin %BRANCH%

ECHO.
ECHO --------------------------------------
ECHO DEPLOY FINALIZADO PARA: %BRANCH%
ECHO --------------------------------------
PAUSE
