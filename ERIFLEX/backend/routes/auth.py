from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from services.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/auth")

class RegisterRequest(BaseModel):
	email: EmailStr
	password: str
	company_name: str
	registration_number: Optional[str] = None
	activities: str
	activities_other: Optional[str] = None
	employee_count: str
	company_phone: str
	first_name: str
	last_name: str
	job_position: str
	professional_address: str
	postal_code: str
	city: str
	country: str = "Vietnam"
	direct_phone: str
	mobile_phone: str
	role: Optional[str] = "user"

class LoginRequest(BaseModel):
	email: EmailStr
	password: str

class UserResponse(BaseModel):
	id: str
	email: EmailStr
	role: str
	created_at: Optional[str] = None

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
	print("Register request received")
	try:
		# Pass the entire dictionary to register_user
		user = register_user(req.dict())
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
