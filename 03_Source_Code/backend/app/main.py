import os
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from app.routers import facility_router, auth_router, user_router, booking_router, test_router, asset_router, item_router

# Import all models to ensure SQLAlchemy registry is populated
import app.models

app = FastAPI(title="IPB Space API")

uploads_dir = os.getenv("UPLOADS_PUBLIC_DIR", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(facility_router.router)
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(booking_router.router)
app.include_router(test_router.router)
app.include_router(asset_router.router)
app.include_router(item_router.router)

@app.get("/")
def home():
    return {"success": True, "data": {"status": "IPB Space Online"}}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": {
                "error": {
                    "message": exc.detail,
                    "type": "http_exception",
                }
            },
        },
    )

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    details = jsonable_encoder(
        exc.errors(),
        custom_encoder={Exception: lambda error: str(error)},
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": {
                "error": {
                    "message": "Validation failed",
                    "type": "validation_error",
                    "details": details,
                }
            },
        },
    )

@app.exception_handler(IntegrityError)
async def sqlalchemy_integrity_exception_handler(request: Request, exc: IntegrityError):
    detail = None
    if hasattr(exc, 'orig') and exc.orig and hasattr(exc.orig, 'args') and exc.orig.args:
        detail = str(exc.orig.args[0])
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "data": {
                "error": {
                    "message": "Data conflict: This ID number or Email is already registered.",
                    "type": "integrity_error",
                    "details": detail,
                }
            },
        },
    )

@app.exception_handler(Exception)
async def unexpected_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": {
                "error": {
                    "message": "Internal server error",
                    "type": "unexpected_error",
                }
            },
        },
    )