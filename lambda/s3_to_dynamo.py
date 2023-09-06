import json
import boto3
import os

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ["TABLE_NAME"]
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    # Extracting S3 bucket and object key from the Lambda event parameter
    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    key = event["Records"][0]["s3"]["object"]["key"]

    print(f"Debug - Bucket: {bucket}, Key: {key}")  # Debugging line

    s3_client = boto3.client("s3")

    try:
        s3_response = s3_client.get_object(Bucket=bucket, Key=key)
    except Exception as e:
        print(f"An error occurred: {e}")  # Debugging line
        raise e

    # Reading the object that was just uploaded
    s3_data = s3_response["Body"].read().decode("utf-8")
    data = json.loads(s3_data)

    if isinstance(data, list):
        for item in data:
            table.put_item(Item=item)
    else:
        table.put_item(Item=data)

    return {"statusCode": 200, "body": json.dumps("Data inserted!")}
