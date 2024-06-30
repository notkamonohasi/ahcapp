import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { config } from "./config";
import { createLambdaFunctionFromAsset } from "./createLambda";

export class InputAnalyzer extends Construct {
  constructor(
    scope: Construct,
    id: string,
    api: apigateway.RestApi,
    props?: cdk.StackProps
  ) {
    super(scope, id);

    const lambdaFunction = createLambdaFunctionFromAsset(
      this,
      "InputAnalyzer",
      1024,
      3,
      "develop"
    );

    const resource = api.root.addResource("InputAnalyzer");
    resource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(lambdaFunction),
      { apiKeyRequired: true }
    );

    const bucket = s3.Bucket.fromBucketName(this, "Bucket", config.bucketName);
    bucket.grantReadWrite(lambdaFunction);
    bucket.grantPut(lambdaFunction);
  }
}
