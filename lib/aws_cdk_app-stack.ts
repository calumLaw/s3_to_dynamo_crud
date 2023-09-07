import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_s3_notifications as s3n } from 'aws-cdk-lib';




export class AwsCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket with versioning enabled
    const bucket = new s3.Bucket(this, 'UploadBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // deletes bucket when app is destroyed
      autoDeleteObjects: true, // bucket can't be deleted until objects are deleted
    });

    // Lambda function for S3 uploads
    const uploadFunction = new lambda.Function(this, 'UploadFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'upload_s3.lambda_handler',  
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    });

    // Grant the Lambda function permissions to read and write to the S3 bucket
    bucket.grantReadWrite(uploadFunction);

    // API Gateway for S3
      const s3_api = new apigateway.LambdaRestApi(this, 'FileUploadApi', {
      handler: uploadFunction,
      binaryMediaTypes: ['*/*'],
    });

    // DynamoDB creation 
    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      replicationRegions: ["eu-west-2", "us-east-2", "us-west-2"], // creates a "global table" through regions
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,  // or PROVISIONED. Scales throughput 
      pointInTimeRecovery: true, // provides continuous backups of the table data for the last 35 days
      removalPolicy: cdk.RemovalPolicy.DESTROY //change to RETAIN to keep table when stack is deleted
    });

    // Lambda function to insert data into DynamoDB table from object uploaded into S3 bucket
    const s3ToDynamoFunction = new lambda.Function(this, 'S3ToDynamoFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 's3_to_dynamo.lambda_handler', 
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName
      },
    });

    // Grant the Lambda function permissions to write to the DynamoDB table
    table.grantWriteData(s3ToDynamoFunction);
    bucket.grantRead(s3ToDynamoFunction);
    bucket.grantDelete(s3ToDynamoFunction);

    // Set up S3 event notification
    const notification = new s3n.LambdaDestination(s3ToDynamoFunction);
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, notification);
  

    // CRUD Integration 
    
    // Create a new Lambda function for CRUD operations
    const crudFunction = new lambda.Function(this, 'CrudFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'crud_api.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Create API Gateway for CRUD operations
    const restApi = new apigateway.RestApi(this, 'CRUDApi');

    // Create a resource for /items
    const itemsResource = restApi.root.addResource('items');

    // Add PUT method to /items
    itemsResource.addMethod('PUT', new apigateway.LambdaIntegration(crudFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Add GET method to /items
    itemsResource.addMethod('GET', new apigateway.LambdaIntegration(crudFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Create a resource for /items/{id}
    const itemByIdResource = itemsResource.addResource('{id}');

    // Add GET method to /items/{id}
    itemByIdResource.addMethod('GET', new apigateway.LambdaIntegration(crudFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Add DELETE method to /items/{id}
    itemByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(crudFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Table access for CRUD calls
    table.grantFullAccess(crudFunction);

  }
}
