@echo off
call venv\Scripts\activate
uvicorn queryBusbar:app --host 0.0.0.0 --port 8000
pause
