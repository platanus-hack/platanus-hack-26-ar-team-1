"""Supabase Storage — replaces S3 for media uploads."""
import time
from integrations.whatsapp import get_file, download

BUCKET = "media"


def handle_media_upload(media_id, patient_id):
    """Download media from WhatsApp and upload to Supabase Storage.
    Returns (public_url, mime_type) or (None, None) on failure."""
    from database.supabase import _db
    try:
        file_info = get_file(media_id)
        if not file_info:
            return None, None

        download_url = file_info.get("download_url") or file_info.get("url")
        mime_type = file_info.get("mime_type", "application/octet-stream")

        content = download(download_url)
        if not content:
            return None, None

        ext = _ext_from_mime(mime_type)
        path = f"patients/{patient_id}/{int(time.time())}_{media_id}{ext}"

        _db().storage.from_(BUCKET).upload(
            path,
            content,
            {"content-type": mime_type},
        )

        public_url = _db().storage.from_(BUCKET).get_public_url(path)
        print(f"Uploaded media: mime_type={mime_type}")
        return public_url, mime_type

    except Exception as e:
        print(f"Error uploading media: {e}")
        return None, None


def _ext_from_mime(mime_type):
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "audio/ogg": ".ogg",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".m4a",
        "video/mp4": ".mp4",
        "application/pdf": ".pdf",
    }.get(mime_type, "")
