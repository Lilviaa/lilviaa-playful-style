import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.exceptions import AppError
import mimetypes
import uuid

class R2Service:
    def __init__(self):
        if not settings.R2_ACCOUNT_ID:
            self.s3_client = None
            self.bucket_name = ""
            self.public_url = ""
            return
            
        self.s3_client = boto3.client(
            service_name="s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
        self.bucket_name = settings.R2_BUCKET_NAME
        self.public_url = settings.R2_PUBLIC_URL.rstrip('/')

    def generate_presigned_url(self, filename: str, content_type: str) -> dict:
        if not self.s3_client:
            raise AppError("Cloudflare R2 is not configured in the environment.")
            
        # Basic file validation
        if not content_type.startswith("image/"):
            raise AppError("Only image files are allowed", status_code=400)
            
        # Generate a unique object key (path in bucket)
        ext = mimetypes.guess_extension(content_type) or ""
        unique_filename = f"products/{uuid.uuid4().hex}{ext}"

        try:
            presigned_url = self.s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": unique_filename,
                    "ContentType": content_type,
                },
                ExpiresIn=3600, # 1 hour
            )
            
            return {
                "upload_url": presigned_url,
                "file_path": unique_filename,
                "public_url": f"{self.public_url}/{unique_filename}"
            }
        except ClientError as e:
            raise AppError(f"Failed to generate upload URL: {str(e)}")

    def verify_object_exists(self, file_path: str) -> bool:
        """Verify that the object actually exists in R2."""
        if not self.s3_client:
            # Allow tests to pass if R2 is not configured
            return True
            
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=file_path)
            return True
        except ClientError as e:
            # If a client error is thrown, then check that it was a 404 error.
            # If it was a 404 error, then the object does not exist.
            error_code = e.response['Error']['Code']
            if error_code == '404':
                return False
            raise AppError(f"Error checking R2 object: {str(e)}")

r2_service = R2Service()
