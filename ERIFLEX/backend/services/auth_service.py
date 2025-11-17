from typing import Optional, Dict, Any
from passlib.hash import bcrypt
from models.user import init_user_table, get_user_by_email, create_user, get_user_by_id, db

def register_user(email: str, password: str, role: str = "user") -> Dict[str, Any]:
	"""Tạo user mới, trả về object user (không kèm password_hash). Ném ValueError nếu email tồn tại."""
	init_user_table()
	if get_user_by_email(email):
		raise ValueError("email already registered")
	pw_hash = bcrypt.hash(password)
	user_id = create_user(email, pw_hash, role)
	return get_user_by_id(user_id)

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
	"""Xác thực user, trả về user dict (không kèm password_hash) nếu hợp lệ, ngược lại None."""
	init_user_table()
	row = db.fetch_one("SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?;", (email,))
	if not row:
		return None
	if not bcrypt.verify(password, row.get("password_hash", "")):
		return None
	row.pop("password_hash", None)
	return row
