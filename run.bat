@echo off
REM run.bat - Script for running the Ebook Search application on Windows

echo [94mEbook Search Application Setup[0m

REM Check if virtual environment exists, create if not
if not exist venv (
    echo [93mVirtual environment not found. Creating one...[0m
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Check if requirements are installed
echo [94mChecking requirements...[0m
pip install -r requirements.txt

REM Create library directory if it doesn't exist
if not exist library (
    echo [93mCreating library directory...[0m
    mkdir library
    mkdir library\AI
    echo Add your ebooks here > library\put-ebooks-here.txt
    echo Add your AI-related ebooks here > library\AI\put-ebooks-here.txt
)

REM Create instance directory if it doesn't exist (for SQLite)
if not exist instance (
    echo [93mCreating instance directory for database...[0m
    mkdir instance
)

REM Start the backend server in a new window
echo [92mStarting backend server...[0m
start "Ebook Search Backend" cmd /k "call venv\Scripts\activate && python backend\run.py"

REM Give backend time to start
timeout /t 3 /nobreak > nul

REM Check if frontend dependencies are installed
echo [94mChecking frontend dependencies...[0m
cd frontend
if not exist node_modules (
    echo [93mInstalling frontend dependencies...[0m
    call npm install
)

REM Start the frontend server in a new window
echo [92mStarting frontend server...[0m
start "Ebook Search Frontend" cmd /k "call npm start"

REM Return to the project root
cd ..

echo [94mApplication is running![0m
echo [94mAccess the web interface at: http://localhost:3000[0m
echo [94mClose the command windows to stop the servers[0m

REM Keep the main script running
pause