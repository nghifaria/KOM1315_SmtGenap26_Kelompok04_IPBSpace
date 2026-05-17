from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
from pathlib import Path
from pydantic import SecretStr

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=SecretStr(settings.MAIL_PASSWORD),
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates' / 'email'
)

class MailService:
    def __init__(self):
        self.fastmail = FastMail(conf)

    async def send_email(self, recipients: list, subject: str, body: str, subtype: MessageType = MessageType.html):
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=subtype
        )
        await self.fastmail.send_message(message)

    async def send_with_template(self, recipients: list, subject: str, template_name: str, template_body: dict):
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            template_body=template_body,
            subtype=MessageType.html
        )
        await self.fastmail.send_message(message, template_name=template_name)

mail_service = MailService()
