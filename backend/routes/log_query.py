from fastapi import APIRouter, HTTPException, Query
from models import log_query as log_model

router = APIRouter(prefix="/admin", tags=["analytics"])

@router.get("/analytics")
def get_analytics(days: int = Query(7, ge=1, le=365), activity_limit: int = Query(20, ge=1, le=100)):
	try:
		required = ["get_daily_search_stats", "get_total_search_stats", "get_user_search_activity"]
		if not all(hasattr(log_model, attr) for attr in required):
			raise HTTPException(status_code=501, detail="Analytics functions not implemented")
		return {
			"daily_stats": log_model.get_daily_search_stats(days),
			"total_stats": log_model.get_total_search_stats(),
			"user_activity": log_model.get_user_search_activity(activity_limit),
		}
	except HTTPException:
		raise
	except Exception as exc:
		print(f"[analytics] error: {exc}")
		raise HTTPException(status_code=500, detail="Internal server error")

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
