from enum import Enum
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from typing import Any, cast
import resend
import structlog
from app.core.config import settings

logger = structlog.get_logger()

# Set Resend API Key
resend.api_key = settings.RESEND_API_KEY

TEMPLATE_FOLDER = Path(__file__).parent.parent / 'templates' / 'email'

class MessageType(str, Enum):
    plain = "plain"
    html = "html"

class MailService:
    def __init__(self):
        self.template_env = Environment(
            loader=FileSystemLoader(TEMPLATE_FOLDER)
        )
        self.mail_from = settings.MAIL_FROM
        self.mail_from_name = settings.MAIL_FROM_NAME

    async def send_email(self, recipients: list, subject: str, body: str, subtype: MessageType = MessageType.html):
        if not resend.api_key:
            logger.warning("resend_api_key_not_configured", subject=subject, recipients=recipients)
            return

        # Defensive normalization of recipients
        if isinstance(recipients, str):
            recipients = [recipients]
        elif not isinstance(recipients, (list, tuple)):
            logger.error("invalid_recipients_type", recipients=recipients)
            raise ValueError("Recipients must be a string or a list of strings")

        # Strip whitespace and filter empty emails
        clean_recipients = [
            email.strip() for email in recipients 
            if email and isinstance(email, str) and email.strip()
        ]

        if not clean_recipients:
            logger.warning("no_valid_recipients_found", subject=subject, original_recipients=recipients)
            return

        # Resend API accepts a single string for a single recipient or a list for multiple
        to_value = clean_recipients[0] if len(clean_recipients) == 1 else clean_recipients

        params = {
            "from": f"{self.mail_from_name.strip()} <{self.mail_from.strip()}>",
            "to": to_value,
            "subject": subject.strip(),
        }

        if subtype == MessageType.html:
            params["html"] = body
        else:
            params["text"] = body

        try:
            logger.info("sending_email_via_resend", subject=subject, recipients=clean_recipients)
            response = await resend.Emails.send_async(cast(Any, params))
            logger.info("email_sent_successfully", email_id=response.get("id"))
            return response
        except Exception as e:
            logger.error("failed_to_send_email", error=str(e), subject=subject, recipients=clean_recipients)
            raise e

    async def send_with_template(self, recipients: list, subject: str, template_name: str, template_body: dict):
        try:
            template = self.template_env.get_template(template_name)
            context = {"subject": subject}
            context.update(template_body)
            rendered_body = template.render(**context)
            
            return await self.send_email(
                recipients=recipients,
                subject=subject,
                body=rendered_body,
                subtype=MessageType.html
            )
        except Exception as e:
            logger.error("failed_to_send_templated_email", error=str(e), template_name=template_name, recipients=recipients)
            raise e

mail_service = MailService()
