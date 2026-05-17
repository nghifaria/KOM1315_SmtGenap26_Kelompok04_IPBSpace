from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, EmailStr
from app.services.mail_service import mail_service
from app.schemas.http import HTTPResponse

router = APIRouter(prefix="/test", tags=["test"])

class EmailRequest(BaseModel):
    email: EmailStr

@router.post("/email")
async def test_email(request: EmailRequest, background_tasks: BackgroundTasks):
    email = request.email
    # Sending as a background task to not block the request
    background_tasks.add_task(
        mail_service.send_with_template,
        recipients=[email],
        subject="Test Email from IPB Space",
        template_name="welcome.html",
        template_body={"name": "Test User", "subject": "Test Email from IPB Space"}
    )
    return HTTPResponse(success=True, data={"message": f"Test email sent to {email} in background"})
