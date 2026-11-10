@echo off
echo ==============================================
echo Building Krisha Dry Fruits Admin APK...
echo ==============================================

cd /d "%~dp0android"

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"

echo Using Java: %JAVA_HOME%
echo Using Android SDK: %ANDROID_HOME%

call "%USERPROFILE%\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin\gradle.bat" assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================
    echo BUILD SUCCESSFUL!
    echo ==============================================
    copy /y "app\build\outputs\apk\debug\app-debug.apk" "..\krisha-admin.apk"
    echo Saved to: %~dp0krisha-admin.apk
) else (
    echo.
    echo ==============================================
    echo BUILD FAILED. Check logs above.
    echo ==============================================
)

pause
