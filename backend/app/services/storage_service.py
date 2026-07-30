import mimetypes
import uuid
import io
from app.core.config import settings
from app.core.exceptions import AppError
from app.db.supabase import get_supabase
from PIL import Image, UnidentifiedImageError

class StorageService:
    def __init__(self):
        self.bucket_name = "product-images"
        
        # Public URL prefix for Supabase storage
        self.public_url_base = f"{settings.SUPABASE_URL}/storage/v1/object/public/{self.bucket_name}"

    def generate_presigned_url(self, filename: str, content_type: str) -> dict:
        """
        Returns an upload URL that points to our own backend,
        so the frontend will send the file to us for processing.
        """
        if not content_type.startswith("image/"):
            raise AppError("Only image files are allowed", status_code=400)
            
        ext = mimetypes.guess_extension(content_type) or ""
        unique_filename = f"products/{uuid.uuid4().hex}{ext}"

        upload_url = f"/admin/products/upload/direct/{unique_filename}"
        
        return {
            "upload_url": upload_url,
            "file_path": unique_filename,
            "public_url": f"{self.public_url_base}/{unique_filename}"
        }

    def process_and_upload_image(self, file_bytes: bytes, file_path: str):
        """
        Resize, compress, and upload the image to Supabase Storage.
        Enforces a 10MB limit.
        """
        MAX_SIZE = 10 * 1024 * 1024 # 10MB
        if len(file_bytes) > MAX_SIZE:
            raise AppError("File size exceeds 10MB limit", status_code=400)
            
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                max_width = 1200
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                output_buffer = io.BytesIO()
                img.save(output_buffer, format="JPEG", quality=85, optimize=True)
                compressed_bytes = output_buffer.getvalue()
        except UnidentifiedImageError:
            raise AppError("Invalid image format or corrupted file", status_code=400)
        except Exception as e:
            raise AppError(f"Error processing image: {str(e)}", status_code=400)
            
        supabase = get_supabase()
        try:
            res = supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=compressed_bytes,
                file_options={"content-type": "image/jpeg"}
            )
        except Exception as e:
            raise AppError(f"Failed to upload to storage: {str(e)}", status_code=400)

    def verify_object_exists(self, file_path: str) -> bool:
        """Verify that the object actually exists in Supabase Storage."""
        supabase = get_supabase()
        try:
            parts = file_path.split("/")
            if len(parts) == 2:
                folder, filename = parts
                files = supabase.storage.from_(self.bucket_name).list(folder)
                for f in files:
                    if f.get("name") == filename:
                        return True
            return False
        except Exception:
            return False

storage_service = StorageService()
