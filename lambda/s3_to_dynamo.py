import json
import boto3
import os

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def lambda_handler(event, context):
    # Extracting S3 bucket and object key from the Lambda event parameter
    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    key = event["Records"][0]["s3"]["object"]["key"]

    s3_client = boto3.client("s3")

    try:
        s3_response = s3_client.get_object(Bucket=bucket, Key=key)
    except Exception as e:
        print(f"An error occurred: {e}")
        raise e

    # Reading the object that was just uploaded
    s3_data = s3_response["Body"].read().decode("utf-8")

    data = json.loads(
        s3_data
    )  # Convert JSON from S3 into a Python list of dictionaries

    # Insert the data into DynamoDB
    try:
        # Insert the data into DynamoDB
        if isinstance(data, list):
            for item in data:
                table.put_item(Item=item)
        else:
            table.put_item(Item=data)

        #  If data insertion was successful; delete the S3 object
        s3_client.delete_object(Bucket=bucket, Key=key)

        return {
            "statusCode": 200,
            "body": json.dumps("Data successfully uploaded and inserted!"),
        }

    except Exception as e:
        print(f"An error occurred while inserting data or deleting the object: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps("Failed to insert data or delete object"),
        }
