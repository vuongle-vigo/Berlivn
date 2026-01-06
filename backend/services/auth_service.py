from typing import Optional, Dict, Any
from passlib.hash import bcrypt
from models.user import init_user_table, get_user_by_email, create_user, get_user_by_id, db, get_user_by_registration_number

def register_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
	"""
	Tạo user mới. user_data chứa email, password, registration_number và các trường profile bắt buộc.
	Ném ValueError nếu email hoặc registration_number tồn tại.
	"""
	print(user_data)
	init_user_table()

	# Validate registration_number uniqueness
	registration_number = user_data.get("registration_number")
	if not registration_number:
		raise ValueError("Registration number is required")

	if get_user_by_registration_number(registration_number):
		raise ValueError("Registration number (Tax Code) already registered")

	email = user_data.get("email")
	if not email:
		raise ValueError("Email is required")

	if get_user_by_email(email):
		raise ValueError("Email already registered")
	
	password = user_data.get("password")
	if not password:
		raise ValueError("Password is required")

	pw_hash = bcrypt.hash(password)
	
	# Chuẩn bị dữ liệu cho create_user
	create_kwargs = user_data.copy()
	create_kwargs.pop("password", None)
	create_kwargs["password_hash"] = pw_hash
	
	# create_user sẽ raise TypeError nếu thiếu tham số bắt buộc
	user_id = create_user(**create_kwargs)
	return get_user_by_id(user_id)

def authenticate_user(registration_number: str, password: str) -> Optional[Dict[str, Any]]:
	"""Xác thực user bằng Mã số thuế, trả về user dict (không kèm password_hash) nếu hợp lệ, ngược lại None."""
	init_user_table()
	# Sử dụng get_user_by_registration_number thay vì email
	row = get_user_by_registration_number(registration_number)
	
	if not row:
		return None
		
	if not bcrypt.verify(password, row.get("password_hash", "")):
		return None
		
	# Kiểm tra tài khoản có active không
	if row.get("is_active") != 1:
		return None

	row.pop("password_hash", None)
	return row
