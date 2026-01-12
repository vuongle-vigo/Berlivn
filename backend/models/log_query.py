from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timedelta
from database.database import Database

db = Database()

_LOG_QUERY_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS user_search_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  log_date TEXT NOT NULL,
  search_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_search_logs_user_date ON user_search_logs(user_id, log_date);
"""

def init_log_query_table() -> None:
	db.executescript(_LOG_QUERY_TABLE_SQL)

init_log_query_table()

def increment_daily_search_log(user_id: str, log_date: Optional[str] = None) -> None:
	day = log_date or datetime.now().strftime("%Y-%m-%d")
	print(f"Logging search for user {user_id} on date {day}")
	try:
		row = db.fetch_one(
			"SELECT id, search_count FROM user_search_logs WHERE user_id = ? AND log_date = ?;",
			(user_id, day)
		)
	except Exception as exc:
		print(f"[user_search_logs] fetch error: {exc}")
		return
	try:
		if row:
			db.execute(
				"UPDATE user_search_logs SET search_count = ?, updated_at = datetime('now') WHERE id = ?;",
				(row["search_count"] + 1, row["id"]),
				commit=True
			)
		else:
			db.execute(
				"INSERT INTO user_search_logs (id, user_id, log_date, search_count) VALUES (?, ?, ?, ?);",
				(str(uuid.uuid4()), user_id, day, 1),
				commit=True
			)
	except Exception as exc:
		print(f"[user_search_logs] upsert error: {exc}")

def get_daily_search_stats(days: int) -> List[Dict[str, Any]]:
	days = max(1, min(days, 365))
	start_date = (datetime.now().date() - timedelta(days=days - 1)).strftime("%Y-%m-%d")
	end_date = datetime.now().strftime("%Y-%m-%d")
	rows = db.fetch_all(
		"""
		SELECT log_date, SUM(search_count) AS total_searches
		FROM user_search_logs
		WHERE log_date BETWEEN ? AND ?
		GROUP BY log_date
		""",
		(start_date, end_date)
	)
	counts = {row["log_date"]: row["total_searches"] for row in rows}
	stats: List[Dict[str, Any]] = []
	current = datetime.strptime(start_date, "%Y-%m-%d").date()
	end = datetime.strptime(end_date, "%Y-%m-%d").date()
	while current <= end:
		day = current.strftime("%Y-%m-%d")
		stats.append({"date": day, "total_searches": counts.get(day, 0)})
		current += timedelta(days=1)
	return stats

def get_total_search_stats() -> Dict[str, Any]:
	today = datetime.now().strftime("%Y-%m-%d")
	week_start = (datetime.now().date() - timedelta(days=6)).strftime("%Y-%m-%d")
	total_users = db.fetch_one("SELECT COUNT(*) AS total FROM users;") or {"total": 0}
	active_users = db.fetch_one(
		"SELECT COUNT(DISTINCT user_id) AS active FROM user_search_logs WHERE log_date >= ?;",
		(week_start,)
	) or {"active": 0}
	total_searches = db.fetch_one(
		"SELECT SUM(search_count) AS total FROM user_search_logs;"
	) or {"total": 0}
	today_searches = db.fetch_one(
		"SELECT SUM(search_count) AS total FROM user_search_logs WHERE log_date = ?;",
		(today,)
	) or {"total": 0}
	return {
		"total_users": total_users["total"] or 0,
		"active_users": active_users["active"] or 0,
		"total_searches": total_searches["total"] or 0,
		"today_searches": today_searches["total"] or 0,
	}

def get_user_search_activity(limit: int = 20) -> List[Dict[str, Any]]:
	limit = max(1, min(limit, 100))
	rows = db.fetch_all(
		f"""
		SELECT
			u.id AS user_id,
			CASE
				WHEN TRIM(u.first_name || ' ' || u.last_name) != '' THEN TRIM(u.first_name || ' ' || u.last_name)
				WHEN u.company_name IS NOT NULL THEN u.company_name
				ELSE u.email
			END AS user_name,
			u.email,
			COALESCE(SUM(l.search_count), 0) AS total_searches,
			MAX(l.log_date) AS last_active
		FROM users u
		LEFT JOIN user_search_logs l ON u.id = l.user_id
		GROUP BY u.id
		ORDER BY total_searches DESC, u.created_at DESC
		LIMIT {limit}
		"""
	)
	return [
		{
			"user_id": row["user_id"],
			"user_name": row["user_name"],
			"email": row["email"],
			"total_searches": row["total_searches"] or 0,
			"last_active": row["last_active"],
		}
		for row in rows
	]

def list_search_logs(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
	rows = db.fetch_all(
		"""
		SELECT
			l.id,
			l.user_id,
			u.email,
			CASE
				WHEN TRIM(u.first_name || ' ' || u.last_name) != '' THEN TRIM(u.first_name || ' ' || u.last_name)
				WHEN u.company_name IS NOT NULL THEN u.company_name
				ELSE u.email
			END AS user_name,
			l.log_date,
			l.search_count
		FROM user_search_logs l
		LEFT JOIN users u ON u.id = l.user_id
		ORDER BY l.log_date DESC, l.created_at DESC
		LIMIT ? OFFSET ?;
		""",
		(limit, offset)
	)
	return [
		{
			"id": row["id"],
			"user_id": row["user_id"],
			"user_name": row["user_name"],
			"email": row["email"],
			"log_date": row["log_date"],
			"search_count": row["search_count"],
		}
		for row in rows
	]

def get_search_logs_for_user(user_id: str, days: int = 30) -> List[Dict[str, Any]]:
	days = max(1, min(days, 365))
	start_date = (datetime.now().date() - timedelta(days=days - 1)).strftime("%Y-%m-%d")
	rows = db.fetch_all(
		"""
		SELECT log_date, search_count
		FROM user_search_logs
		WHERE user_id = ? AND log_date BETWEEN ? AND ?
		ORDER BY log_date DESC;
		""",
		(user_id, start_date, datetime.now().strftime("%Y-%m-%d"))
	)
	return [{"log_date": row["log_date"], "search_count": row["search_count"]} for row in rows]
