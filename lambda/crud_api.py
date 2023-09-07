import json
import boto3
import os

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "GET")  # Default to GET if not provided
    params = (
        event.get("pathParameters") if event.get("pathParameters") is not None else {}
    )
    item_id = params.get("id") if params else None

    raw_body = event.get("body")
    body = json.loads(raw_body) if raw_body else {}

    if http_method == "PUT":
        table.put_item(Item=body)
        return {"statusCode": 200, "body": json.dumps(f"Put item {body.get('id')}")}

    elif http_method == "GET":
        if item_id:
            item = table.get_item(Key={"id": item_id}).get("Item", {})
            return {"statusCode": 200, "body": json.dumps(item)}
        else:
            items = table.scan().get("Items", [])
            return {"statusCode": 200, "body": json.dumps(items)}

    elif http_method == "DELETE":
        if item_id:
            table.delete_item(Key={"id": item_id})
            return {"statusCode": 200, "body": json.dumps(f"Deleted item {item_id}")}
        else:
            return {
                "statusCode": 400,
                "body": json.dumps("Item ID required for DELETE"),
            }

    else:
        return {"statusCode": 400, "body": json.dumps("Unsupported method")}
