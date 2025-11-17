from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# import module to call service functions; we call attributes dynamically so missing functions surface as 501
from models import user as user_model
from services.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/api/users", tags=["users"])

class CreateUserRequest(BaseModel):
	email: EmailStr
	password: str
	role: Optional[str] = "user"

class UpdateUserRequest(BaseModel):
	email: Optional[EmailStr] = None
	password: Optional[str] = None
	role: Optional[str] = None

class UserResponse(BaseModel):
	id: int
	email: EmailStr
	role: str
	created_at: Optional[str] = None

@router.get("/", response_model=List[UserResponse])
def list_users():
	try:
		if not hasattr(user_model, "list_users"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="get_all_users not implemented in models.user")
		users = user_model.list_users()
		return users or []
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
	try:
		if not hasattr(user_model, "get_user_by_id"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="get_user_by_id not implemented in services.user_model")
		user = user_model.get_user_by_id(user_id)
		if not user:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
		return user
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(req: CreateUserRequest):
	try:
		user = register_user(req.email, req.password, req.role)
		return user
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, req: UpdateUserRequest):
	try:
		if not hasattr(user_model, "update_user"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="update_user not implemented in services.user_model")
		updated = user_model.update_user(user_id, req.dict(exclude_unset=True))
		if not updated:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or not updated")
		return updated
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int):
	try:
		if not hasattr(user_model, "delete_user"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="delete_user not implemented in services.user_model")
		ok = user_model.delete_user(user_id)
		if not ok:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
		return None
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")