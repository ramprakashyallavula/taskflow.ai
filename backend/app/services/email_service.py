from email.message import EmailMessage
import logging
import smtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def send_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        logger.info("SMTP not configured. Email to %s | Subject: %s | Body: %s", to_email, subject, text_body)
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = to_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send email to %s: %s", to_email, exc)
        return False
