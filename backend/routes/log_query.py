from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import Optional
from models import log_query as log_model

router = APIRouter(prefix="/admin", tags=["analytics"])

@router.get("/analytics")
def get_analytics(
	days: Optional[int] = Query(default=None, ge=1, le=365),
	start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
	end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
	activity_limit: int = Query(20, ge=1, le=100)
):
	try:
		required = ["get_daily_search_stats", "get_total_search_stats", "get_user_search_activity"]
		if not all(hasattr(log_model, attr) for attr in required):
			raise HTTPException(status_code=501, detail="Analytics functions not implemented")
		
		# Determine the date range
		if start_date and end_date:
			# Use explicit date range
			date_range_days = (datetime.strptime(end_date, "%Y-%m-%d").date() - datetime.strptime(start_date, "%Y-%m-%d").date()).days + 1
		elif start_date:
			# From start_date to today
			date_range_days = (datetime.now().date() - datetime.strptime(start_date, "%Y-%m-%d").date()).days + 1
		elif days:
			date_range_days = days
		else:
			date_range_days = 7
		
		return {
			"daily_stats": log_model.get_daily_search_stats(date_range_days, start_date, end_date),
			"total_stats": log_model.get_total_search_stats(),
			"user_activity": log_model.get_user_search_activity(activity_limit),
		}
	except HTTPException:
		raise
	except Exception as exc:
		print(f"[analytics] error: {exc}")
		import traceback
		traceback.print_exc()
		raise HTTPException(status_code=500, detail=f"Internal server error: {str(exc)}")

@router.get("/search-logs")
def list_search_logs(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
	try:
		if not hasattr(log_model, "list_search_logs"):
			raise HTTPException(status_code=501, detail="list_search_logs not implemented")
		return {"logs": log_model.list_search_logs(limit, offset)}
	except HTTPException:
		raise
	except Exception as exc:
		print(f"[analytics] list logs error: {exc}")
		raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/search-logs/{user_id}")
def get_user_search_logs(user_id: str, days: int = Query(30, ge=1, le=365)):
	try:
		if not hasattr(log_model, "get_search_logs_for_user"):
			raise HTTPException(status_code=501, detail="get_search_logs_for_user not implemented")
		return {"logs": log_model.get_search_logs_for_user(user_id, days)}
	except HTTPException:
		raise
	except Exception as exc:
		print(f"[analytics] user logs error: {exc}")
		raise HTTPException(status_code=500, detail="Internal server error")
