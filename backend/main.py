from fastapi import FastAPI
from routes.auth import router as auth_router
from routes.query_busbar import router as query_busbar_router
from routes.user import router as user_router
from fastapi.middleware.cors import CORSMiddleware
from models.user import init_user_table  # sửa tại đây

origins = [
    "http://localhost:5173",
    "http://103.90.224.132:80",
    "https://yourdomain.com",
]

def create_app():
    app = FastAPI()

    @app.on_event("startup")
    def startup():
        try:
            init_user_table()
        except Exception:
            pass

    app.include_router(auth_router)
    app.include_router(query_busbar_router)
    app.include_router(user_router)
    return app


app = create_app()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
