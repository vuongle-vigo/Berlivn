from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from services.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/auth")

class RegisterRequest(BaseModel):
	email: EmailStr
	password: str
	role: Optional[str] = "user"

class LoginRequest(BaseModel):
	email: EmailStr
	password: str

class UserResponse(BaseModel):
	id: int
	email: EmailStr
	role: str
	created_at: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
	print("Register request received")
	try:
		user = register_user(req.email, req.password, 'admin')
		return user
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=UserResponse)
def login(req: LoginRequest):
	print(req)
	user = authenticate_user(req.email, req.password)
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
	return user
