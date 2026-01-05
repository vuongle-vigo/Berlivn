from typing import Optional, Dict, Any, List
import uuid
from database.database import Database

db = Database()

# Schema: Updated to new structure with company info and profile details
_USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  registration_number TEXT,
  activities TEXT NOT NULL,
  activities_other TEXT,
  employee_count TEXT NOT NULL,
  company_phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  job_position TEXT NOT NULL,
  professional_address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Vietnam',
  direct_phone TEXT NOT NULL,
  mobile_phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  CHECK (role IN ('user', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_name);
"""

def init_user_table() -> None:
	"""Tạo bảng users nếu chưa tồn tại."""
	db.executescript(_USERS_TABLE_SQL)

def create_user(
	email: str, 
	password_hash: str, 
	company_name: str,
	activities: str,
	employee_count: str,
	company_phone: str,
	first_name: str,
	last_name: str,
	job_position: str,
	professional_address: str,
	postal_code: str,
	city: str,
	direct_phone: str,
	mobile_phone: str,
	registration_number: Optional[str] = None,
	activities_other: Optional[str] = None,
	country: str = "Vietnam",
	role: str = "user"
) -> str:
	"""Chèn user mới, trả về id (UUID)."""
	user_id = str(uuid.uuid4())
	sql = """
		INSERT INTO users (
			id, email, password_hash, company_name, activities, employee_count, 
			company_phone, first_name, last_name, job_position, professional_address, 
			postal_code, city, direct_phone, mobile_phone, registration_number, 
			activities_other, country, role
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	"""
	params = (
		user_id, email, password_hash, company_name, activities, employee_count,
		company_phone, first_name, last_name, job_position, professional_address,
		postal_code, city, direct_phone, mobile_phone, registration_number,
		activities_other, country, role
	)
	db.execute(sql, params, commit=True)
	return user_id

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
	return db.fetch_one("SELECT * FROM users WHERE id = ?;", (user_id,))

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
	return db.fetch_one("SELECT * FROM users WHERE email = ?;", (email,))

def update_user(user_id: str, **fields) -> bool:
	"""
	Update các trường cho user.
	Trả về True nếu có hàng được cập nhật.
	"""
	if not fields:
		return False
	
	# Auto update updated_at
	cols = ", ".join(f"{k}=?" for k in fields.keys())
	cols += ", updated_at = datetime('now')"
	
	params = tuple(fields.values()) + (user_id,)
	sql = f"UPDATE users SET {cols} WHERE id = ?;"
	db.execute(sql, params, commit=True)
	row = db.fetch_one("SELECT id FROM users WHERE id = ?;", (user_id,))
	return row is not None

def delete_user(user_id: str) -> bool:
	db.execute("DELETE FROM users WHERE id = ?;", (user_id,), commit=True)
	row = db.fetch_one("SELECT id FROM users WHERE id = ?;", (user_id,))
	return row is None

def list_users(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
	return db.fetch_all("SELECT id, email, first_name, last_name, company_name, role, created_at, is_active FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?;", (limit, offset))