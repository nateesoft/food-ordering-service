@echo off
REM Start all food-ordering PM2 apps (service, console, system) after they were
REM stopped or deleted. Extra args are passed through: --restart, --dry-run, --root=<path>
REM
REM PM2_HOME must match the one Jenkins uses, otherwise this talks to a different
REM PM2 daemon and will not see (or will duplicate) the Jenkins-managed apps.
if "%PM2_HOME%"=="" set "PM2_HOME=C:\Users\Administrator\.pm2"

node "%~dp0pm2-start-all.js" %*
set EXIT_CODE=%ERRORLEVEL%

REM Keep the window open when launched by double-click.
echo %CMDCMDLINE% | find /i "/c" >nul && pause
exit /b %EXIT_CODE%
