# S3 to DynamoDB CRUD Application

## Architecture

- **S3 Bucket**: Used for file storage. Supports versioning. If object data is inserted to the table, objects are deleted via Lambda.
- **API Gateway**: Exposes REST endpoints for JSON file uploads and CRUD operations.
- **Lambda Functions**: Handles S3 file uploads, inserts data from S3 to DynamoDB and deletes object from S3, and performs CRUD operations.
- **DynamoDB Table**: Stores the data. Configured with multi-region replication and point-in-time recovery.

## Prerequisites to Install

- Node.js
- AWS CLI installed
- AWS CDK
- Python

## Deployment

1. **Clone this repository**.
   ```bash
    git clone https://github.com/calumLaw/s3_to_dynamo_crud.git
    ```
3. **Install the dependencies**:
    ```bash
    npm install aws-cdk-lib
    ```
4. **Bootstrap the CDK app**:
    ```bash
    cdk bootstrap
    ```
5. **Deploy the CDK stack**:
    ```bash
    cdk deploy
    ```

6. **API Endpoints**: After the deployment is complete, you will receive 2 API endpoints from the terminal, or access them from within the AWS API Gateway console:
    - AwsCdkAppStack.CRUDApiEndpoint
    - AwsCdkAppStack.FileUploadApiEndpoint

## How to Use the Application

### File Upload via API

To upload a file to the S3 bucket, use a `POST` request with the following headers:

- `X-Filename`: [Your file name with extension] (optional)
- `Content-Type`: [File content type] (optional)

**Example**:
```bash
curl -X POST [Your-FileUpload-API-Gateway-URL] -H "X-Filename: sample_data.json" --data-binary "@path/to/sample_data.json"
```
OR without headers:
```bash
curl -X POST [Your-FileUpload-API-Gateway-URL] --data-binary "@dir/sample_data.json"
```

### CRUD Operations via API

The CRUD operations can be performed using the REST API. Here are some example CURL commands to interact with the API:

#### Create (PUT)

To insert an item into the DynamoDB table ("\" included as escape characters):

```bash
curl -X PUT -H "Content-Type: application/json" --data '{"\id\": "\1\", "\name\": "\Apple\"}' [Your-CRUDApiEndpoint-URL]/items
```

#### Read (GET)

To get a list of all items:

```bash
curl -X GET [Your-CRUDApiEndpoint-URL]/items
```

To get a single item by ID:

```bash
curl -X GET [Your-CRUDApiEndpoint-URL]/items/1
```

#### Delete (DELETE)

To delete an item by ID:

```bash
curl -X DELETE [Your-CRUDApiEndpoint-URL]/items/1
```


## Features

- **File Upload**: Upload your files seamlessly through API calls. If inserted into your DynamoDB table succesfully, the S3 object will be deleted but still retrievable via versions. 
- **CRUD Operations**: Full Create, Read, Update, and Delete functionality for DynamoDB records.
- **High Availability**: The application's architecture is designed for high availability for DynamoDB records via regions.
  
## Security

This application uses AWS's built-in security features. However, please note that there's no additional layer of security for API access. You may implement API keys or other security measures for enhanced security.

## Limitations

- The application currently does not support batch uploads or downloads.
- No additional security measures for API calls.

### Potential Improvements for Redundancy and Fault Tolerance

1. **Lambda Multi-Region Deployment**: Consider deploying your Lambda functions in multiple AWS regions to mitigate the impact of a single regional outage.

2. **API Gateway Multi-Region Deployment**: To increase the fault tolerance of your API, configure API Gateway for multi-region availability.

3. **S3 Multi-Region Replication**: Implement S3 cross-region replication to ensure that your data is available in more than one geographical location for increased redundancy.

These additions were not added due to time constraints in testing.

## Troubleshooting

### Common Errors

- **Internal Server Error**: Check the Lambda logs for more details. Usually due to incorrectly formatted JSON or incorrect parameters.
- **Resource Not Found**: Ensure all AWS resources are properly deployed.

