from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# import module to call service functions; we call attributes dynamically so missing functions surface as 501
from models import user as user_model
from services.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/users", tags=["users"])

class CreateUserRequest(BaseModel):
	email: EmailStr
	password: str
	company_name: str
	registration_number: str # Made required for login
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

class UpdateUserRequest(BaseModel):
	email: Optional[EmailStr] = None
	password: Optional[str] = None
	company_name: Optional[str] = None
	registration_number: Optional[str] = None
	activities: Optional[str] = None
	activities_other: Optional[str] = None
	employee_count: Optional[str] = None
	company_phone: Optional[str] = None
	first_name: Optional[str] = None
	last_name: Optional[str] = None
	job_position: Optional[str] = None
	professional_address: Optional[str] = None
	postal_code: Optional[str] = None
	city: Optional[str] = None
	country: Optional[str] = None
	direct_phone: Optional[str] = None
	mobile_phone: Optional[str] = None
	role: Optional[str] = None
	is_active: Optional[int] = None
	daily_search_limit: Optional[int] = None
	daily_search_remaining: Optional[int] = None

class UserResponse(BaseModel):
	id: str
	email: EmailStr
	role: str
	is_active: int
	created_at: Optional[str] = None
	daily_search_limit: Optional[int] = 20
	daily_search_remaining: Optional[int] = 20
	search_count: Optional[int] = 0
	
	# Company fields
	company_name: str
	registration_number: str
	activities: str
	activities_other: Optional[str] = None
	employee_count: str
	company_phone: str

	# Profile fields
	first_name: str
	last_name: str
	job_position: str
	professional_address: str
	postal_code: str
	city: str
	country: str
	direct_phone: str
	mobile_phone: str

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
def get_user(user_id: str):
	try:
		if not hasattr(user_model, "get_user_by_id"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="get_user_by_id not implemented in services.user_model")
		user = user_model.get_user_by_id(user_id)
		print(user)
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
		# register_user now accepts a dict of all fields
		user = register_user(req.dict())
		return user
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, req: UpdateUserRequest):
	try:
		if not hasattr(user_model, "update_user"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="update_user not implemented in services.user_model")
		
		updated = user_model.update_user(user_id, **req.dict(exclude_unset=True))
		if not updated:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or not updated")
		
		# Fetch the updated user to return
		user = user_model.get_user_by_id(user_id)
		return user
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str):
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

@router.post("/{user_id}/increment_search")
def increment_search(user_id: str):
	try:
		if not hasattr(user_model, "check_and_increment_search"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="check_and_increment_search not implemented")
		
		result = user_model.check_and_increment_search(user_id)
		if not result["allowed"]:
			raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Daily search limit reached")
			
		return result
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/{user_id}/daily_search_limit")
def get_daily_search_limit(user_id: str):
	try:
		if not hasattr(user_model, "get_daily_search_limit"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="get_daily_search_limit not implemented")
		quota = user_model.get_daily_search_limit(user_id)
		if quota is None:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or limit unavailable")
		return quota
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{user_id}/decrement_search_limit")
def decrement_daily_search_limit(user_id: str):
	try:
		if not hasattr(user_model, "decrement_daily_search_limit"):
			raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="decrement_daily_search_limit not implemented")
		result = user_model.decrement_daily_search_limit(user_id)
		if not result:
			raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot decrement daily search limit")
		return result
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
