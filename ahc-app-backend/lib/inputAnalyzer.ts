import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { config } from "./config";
import { createLambdaFunctionFromAsset } from "./createLambda";

export class InputAnalyzer extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    const lambdaFunction = createLambdaFunctionFromAsset(
      this,
      "InputAnalyzer",
      1024,
      3,
      "develop"
    );

    const api = new apigateway.RestApi(this, "InputAnalyzerApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
      },
    });
    const apiKey = api.addApiKey("InputAnalyzerApiKey");
    const resource = api.root.addResource("InputAnalyzer");
    resource.addMethod("GET", new apigateway.LambdaIntegration(lambdaFunction));

    const bucket = s3.Bucket.fromBucketName(this, "Bucket", config.bucketName);
    bucket.grantReadWrite(lambdaFunction);
    bucket.grantPut(lambdaFunction);
  }
}
