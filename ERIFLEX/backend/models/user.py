from typing import Optional, Dict, Any, List
from database.database import Database

db = Database()

# Schema: dùng role thay full_name
_USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'user',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_user_table() -> None:
	"""Tạo bảng users nếu chưa tồn tại."""
	db.executescript(_USERS_TABLE_SQL)

def create_user(email: str, password_hash: str, role: str = "user") -> int:
	"""Chèn user mới, trả về id. role mặc định 'user'."""
	sql = "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?);"
	db.execute(sql, (email, password_hash, role), commit=True)
	row = db.fetch_one("SELECT id FROM users WHERE email = ?;", (email,))
	return row["id"]

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
	return db.fetch_one("SELECT id, email, role, created_at FROM users WHERE id = ?;", (user_id,))

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
	return db.fetch_one("SELECT id, email, role, created_at FROM users WHERE email = ?;", (email,))

def update_user(user_id: int, **fields) -> bool:
	"""
	Update các trường cho user. Ví dụ: update_user(1, role='admin', password_hash='newhash')
	Trả về True nếu có hàng được cập nhật.
	"""
	if not fields:
		return False
	cols = ", ".join(f"{k}=?" for k in fields.keys())
	params = tuple(fields.values()) + (user_id,)
	sql = f"UPDATE users SET {cols} WHERE id = ?;"
	db.execute(sql, params, commit=True)
	row = db.fetch_one("SELECT id FROM users WHERE id = ?;", (user_id,))
	return row is not None

def delete_user(user_id: int) -> bool:
	db.execute("DELETE FROM users WHERE id = ?;", (user_id,), commit=True)
	row = db.fetch_one("SELECT id FROM users WHERE id = ?;", (user_id,))
	return row is None

def list_users(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
	return db.fetch_all("SELECT id, email, role, created_at FROM users ORDER BY id LIMIT ? OFFSET ?;", (limit, offset))