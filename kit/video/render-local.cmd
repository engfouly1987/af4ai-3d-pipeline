@echo off
rem AF4AI: render the 3D video frames on this PC (Microsoft Edge + your graphics card). Put this next to video.json and double-click.
cd /d "%~dp0"
chcp 65001 >nul
where node >nul 2>nul || (echo Node.js is not installed. Install it from nodejs.org then run again. & pause & exit /b 1)
if not exist node_modules\playwright-core call npm install --no-audit --no-fund playwright-core three@0.169.0 || goto :err
node render-frames.mjs video.json --local || goto :err
echo.
echo Done. Tell Claude: "الفريمات خلصت"
pause
goto :eof
:err
echo Something went wrong. Send Claude the message above.
pause
