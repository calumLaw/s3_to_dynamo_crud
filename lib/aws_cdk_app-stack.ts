import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';

export class AwsCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    const bucket = new s3.Bucket(this, 'UploadBucket', {
      versioned: true,
    });

    // Create a Lambda function
    const uploadFunction = new lambda.Function(this, 'UploadFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'upload_s3.lambda_handler',  // Assumes that your Lambda code is in a file called 'upload_s3.py'
      code: lambda.Code.fromAsset('lambda'),  // Assumes that your Lambda code is in a directory called 'lambda'
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    });

    // Grant the Lambda function permissions to read and write to the S3 bucket
    bucket.grantReadWrite(uploadFunction);

    // Create an API Gateway
    const api = new apigateway.LambdaRestApi(this, 'FileUploadApi', {
    handler: uploadFunction,
    binaryMediaTypes: ['*/*'],
  });
  }
}
