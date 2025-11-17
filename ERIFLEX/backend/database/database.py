from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional, Iterable

DB_PATH = Path(__file__).parents[1] / "berlivn.db"

class Database:
	"""Lightweight SQLite helper."""
	def __init__(self, path: Optional[Path] = None):
		self.path = Path(path) if path else DB_PATH
		self.path.parent.mkdir(parents=True, exist_ok=True)

	def _connect(self) -> sqlite3.Connection:
		conn = sqlite3.connect(str(self.path))
		conn.row_factory = sqlite3.Row
		conn.execute("PRAGMA foreign_keys = ON;")
		return conn

	def execute(self, sql: str, params: Iterable[Any] = (), commit: bool = False) -> sqlite3.Cursor:
		"""Execute a statement. If commit=True then changes are committed.
		Returns the sqlite3.Cursor.
		"""
		conn = self._connect()
		cur = conn.cursor()
		try:
			cur.execute(sql, tuple(params))
			if commit:
				conn.commit()
			return cur
		finally:
			conn.close()

	def executemany(self, sql: str, seq_of_params: Iterable[Iterable[Any]], commit: bool = False) -> None:
		conn = self._connect()
		try:
			cur = conn.cursor()
			cur.executemany(sql, seq_of_params)
			if commit:
				conn.commit()
		finally:
			conn.close()

	def fetch_one(self, sql: str, params: Iterable[Any] = ()) -> Optional[Dict[str, Any]]:
		conn = self._connect()
		try:
			cur = conn.cursor()
			cur.execute(sql, tuple(params))
			row = cur.fetchone()
			return dict(row) if row else None
		finally:
			conn.close()

	def fetch_all(self, sql: str, params: Iterable[Any] = ()) -> List[Dict[str, Any]]:
		conn = self._connect()
		try:
			cur = conn.cursor()
			cur.execute(sql, tuple(params))
			rows = cur.fetchall()
			return [dict(r) for r in rows]
		finally:
			conn.close()

	def executescript(self, script: str) -> None:
		"""Run multi-statement SQL (for migrations)"""
		conn = self._connect()
		try:
			conn.executescript(script)
			conn.commit()
		finally:
			conn.close()