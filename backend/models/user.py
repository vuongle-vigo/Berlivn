from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
from database.database import Database
from models import log_query

db = Database()

# Schema: Updated to new structure with company info and profile details
_USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  registration_number TEXT UNIQUE, -- Made UNIQUE for login
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
  daily_search_limit INTEGER DEFAULT 20,
  daily_search_remaining INTEGER DEFAULT 20,
  last_search_date TEXT,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  CHECK (role IN ('user', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_registration_number ON users(registration_number); -- Added index for login
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
	registration_number: str, # Moved here, required
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
	activities_other: Optional[str] = None,
	country: str = "Vietnam",
	role: str = "user",
	daily_search_limit: int = 20
) -> str:
	"""Chèn user mới, trả về id (UUID)."""
	user_id = str(uuid.uuid4())
	sql = """
		INSERT INTO users (
			id, email, password_hash, company_name, registration_number, activities, employee_count, 
			company_phone, first_name, last_name, job_position, professional_address, 
			postal_code, city, direct_phone, mobile_phone, 
			activities_other, country, role, daily_search_limit, daily_search_remaining
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	"""
	params = (
		user_id, email, password_hash, company_name, registration_number, activities, employee_count,
		company_phone, first_name, last_name, job_position, professional_address,
		postal_code, city, direct_phone, mobile_phone,
		activities_other, country, role, daily_search_limit, daily_search_limit
	)
	db.execute(sql, params, commit=True)
	return user_id

def _refresh_daily_quota_if_expired(user_id: str, row: Dict[str, Any]) -> Dict[str, Any]:
	row_dict = dict(row)
	limit = row_dict["daily_search_limit"] if row_dict["daily_search_limit"] is not None else 20
	today = datetime.now().strftime("%Y-%m-%d")
	if row_dict.get("last_search_date") != today:
		db.execute(
			"UPDATE users SET daily_search_remaining = ?, last_search_date = ?, updated_at = datetime('now') WHERE id = ?;",
			(limit, today, user_id),
			commit=True
		)
		row_dict["daily_search_remaining"] = limit
		row_dict["last_search_date"] = today
	return row_dict

def check_and_increment_search(user_id: str) -> Dict[str, Any]:
	row = db.fetch_one(
		"SELECT daily_search_limit, daily_search_remaining, last_search_date FROM users WHERE id = ?;",
		(user_id,)
	)
	if not row:
		return {"allowed": False, "remaining": 0, "limit": 0}
	row = _refresh_daily_quota_if_expired(user_id, row)
	limit = row["daily_search_limit"] if row["daily_search_limit"] is not None else 20
	remaining = row["daily_search_remaining"] if row["daily_search_remaining"] is not None else limit
	if remaining <= 0:
		return {"allowed": False, "remaining": 0, "limit": limit}
	new_remaining = max(remaining - 1, 0)
	today = datetime.now().strftime("%Y-%m-%d")
	db.execute(
		"UPDATE users SET daily_search_remaining = ?, last_search_date = ?, updated_at = datetime('now') WHERE id = ?;",
		(new_remaining, today, user_id),
		commit=True
	)
	log_query.increment_daily_search_log(user_id)
	return {"allowed": True, "remaining": new_remaining, "limit": limit}

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
	return db.fetch_one("SELECT * FROM users WHERE id = ?;", (user_id,))

def get_user_by_registration_number(registration_number: str) -> Optional[Dict[str, Any]]:
	return db.fetch_one("SELECT * FROM users WHERE registration_number = ?;", (registration_number,))

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
	return db.fetch_one("SELECT * FROM users WHERE email = ?;", (email,))

def update_user(user_id: str, **fields) -> bool:
	"""
	Update các trường cho user.
	Trả về True nếu có hàng được cập nhật.
	"""
	if not fields:
		return False
	
	if "daily_search_limit" in fields:
		limit_value = fields["daily_search_limit"]
		if limit_value is not None:
			fields.setdefault("daily_search_remaining", limit_value)
			fields.setdefault("last_search_date", datetime.now().strftime("%Y-%m-%d"))
	
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
	return db.fetch_all("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?;", (limit, offset))

def get_daily_search_limit(user_id: str) -> Optional[Dict[str, int]]:
	row = db.fetch_one(
		"SELECT daily_search_limit, daily_search_remaining, last_search_date FROM users WHERE id = ?;",
		(user_id,)
	)
	if not row:
		return None
	row = _refresh_daily_quota_if_expired(user_id, row)
	limit = row["daily_search_limit"] if row["daily_search_limit"] is not None else 20
	remaining = row["daily_search_remaining"] if row["daily_search_remaining"] is not None else limit
	return {"daily_search_limit": limit, "daily_search_remaining": remaining}

def decrement_daily_search_limit(user_id: str) -> Optional[Dict[str, int]]:
	row = db.fetch_one(
		"SELECT daily_search_limit, daily_search_remaining, last_search_date FROM users WHERE id = ?;",
		(user_id,)
	)
	if not row:
		return None
	row = _refresh_daily_quota_if_expired(user_id, row)
	limit = row["daily_search_limit"] if row["daily_search_limit"] is not None else 20
	remaining = row["daily_search_remaining"] if row["daily_search_remaining"] is not None else limit
	if remaining <= 0:
		return None
	new_remaining = max(remaining - 1, 0)
	today = datetime.now().strftime("%Y-%m-%d")
	db.execute(
		"UPDATE users SET daily_search_remaining = ?, last_search_date = ?, updated_at = datetime('now') WHERE id = ?;",
		(new_remaining, today, user_id),
		commit=True
	)
	log_query.increment_daily_search_log(user_id)
	return {"daily_search_limit": limit, "daily_search_remaining": new_remaining}