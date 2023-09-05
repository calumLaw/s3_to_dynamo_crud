import json
import boto3
import base64
import os

s3 = boto3.client("s3")
BUCKET_NAME = os.environ[
    "BUCKET_NAME"
]  # Assuming you've set this in your environment variables


def lambda_handler(event, context):
    # Extract the filename from the header
    filename = event["headers"].get("X-Filename", "default_name.extension")

    # Decode the base64 encoded file content
    file_content = base64.b64decode(event["body"])

    # Use the extracted filename as the S3 object key (i.e., the 'file path')
    file_path = filename

    # Upload the file to S3
    s3.put_object(Bucket=BUCKET_NAME, Key=file_path, Body=file_content)

    return {"statusCode": 200, "body": json.dumps(f"File {filename} uploaded!")}
