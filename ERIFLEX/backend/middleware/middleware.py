import os
import functools
from typing import Callable, Optional, Dict, Any

# Thêm các import tùy chọn (không bắt buộc nếu dự án không dùng Flask/Starlette)
try:
    from flask import request, g
except Exception:
    request = None  # type: ignore
    g = None  # type: ignore

try:
    from starlette.types import ASGIApp, Receive, Scope, Send
except Exception:
    ASGIApp = Receive = Scope = Send = None  # type: ignore

import jwt
from jwt import InvalidTokenError

# Cấu hình: lấy SECRET_KEY từ biến môi trường, fallback sang giá trị dev
SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production")
ALGORITHM = "HS256"


class AuthError(Exception):
    """Raised when authentication fails."""
    pass


def get_token_from_header(headers: Optional[Dict[str, str]] = None) -> str:
    """
    Lấy token từ header Authorization: "Bearer <token>"
    Nếu headers không được truyền, cố gắng lấy từ flask.request
    """
    if headers is None and request is not None:
        auth = request.headers.get("Authorization", "")
    elif headers is not None:
        auth = headers.get("authorization", "") or headers.get("Authorization", "")
    else:
        auth = ""

    if not auth:
        raise AuthError("Authorization header is missing")

    parts = auth.split()
    if parts[0].lower() != "bearer" or len(parts) != 2:
        raise AuthError("Authorization header must be in format: Bearer <token>")

    return parts[1]


def decode_jwt(token: str) -> Dict[str, Any]:
    """
    Giải mã JWT và trả về payload.
    Ném AuthError nếu token không hợp lệ.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except InvalidTokenError as e:
        raise AuthError(f"Invalid token: {str(e)}")


def _attach_user_to_context(user_payload: Dict[str, Any]):
    """
    Thử attach user vào flask.g nếu có, khác thì không làm gì.
    """
    if g is not None:
        try:
            g.current_user = user_payload
        except Exception:
            pass


def auth_required(func: Optional[Callable] = None, *, optional: bool = False):
    """
    Decorator để bảo vệ route functions.
    Sử dụng:
      @auth_required
      def view(...):
          # nếu Flask, user có thể lấy từ flask.g.current_user
          # hoặc hàm nhận kwargs 'current_user' nếu định nghĩa tham số đó
    Tham số optional=True cho phép không có token (trả None thay vì raise).
    """
    def decorator(fn: Callable):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                token = get_token_from_header()
                payload = decode_jwt(token)
                _attach_user_to_context(payload)
                # nếu handler mong đợi current_user, inject vào kwargs
                if "current_user" in fn.__code__.co_varnames:
                    kwargs.setdefault("current_user", payload)
            except AuthError:
                if optional:
                    # không inject user, gọi tiếp
                    return fn(*args, **kwargs)
                # với Flask, có thể trả HTTP 401 từ đây nếu muốn.
                raise
            return fn(*args, **kwargs)
        return wrapper

    # hỗ trợ gọi trực tiếp @auth_required hoặc @auth_required(optional=True)
    if callable(func):
        return decorator(func)
    return decorator


# Optional: ASGI middleware để dùng với FastAPI/Starlette
if ASGIApp is not None:
    class AuthMiddleware:
        """
        ASGI middleware: kiểm tra Authorization header, decode JWT và gán vào scope['user'].
        Nếu token không hợp lệ -> trả 401.
        """
        def __init__(self, app: ASGIApp, *, optional: bool = False):
            self.app = app
            self.optional = optional

        async def __call__(self, scope: Scope, receive: Receive, send: Send):
            # chỉ xử lý HTTP
            if scope.get("type") == "http":
                headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
                try:
                    token = get_token_from_header(headers)
                    payload = decode_jwt(token)
                    scope.setdefault("user", {})  # type: ignore
                    scope["user"].update(payload)  # type: ignore
                except AuthError:
                    if not self.optional:
                        from starlette.responses import JSONResponse  # local import để tránh dep nếu không dùng
                        resp = JSONResponse({"detail": "Unauthorized"}, status_code=401)
                        await resp(scope, receive, send)
                        return
            await self.app(scope, receive, send)