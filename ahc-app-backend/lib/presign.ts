import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { config } from "./config";
import { createLambdaFunctionFromDocker } from "./createLambda";

export class Presign extends Construct {
  constructor(
    scope: Construct,
    id: string,
    presignArns: string[],
    ssmArns: string[],
    api: apigateway.RestApi,
    props?: cdk.StackProps
  ) {
    super(scope, id);

    // C++をコンパイルするため、g++が必要
    const lambdaFunction = createLambdaFunctionFromDocker(
      this,
      "Presign",
      1024,
      1,
      "develop"
    );

    const resource = api.root.addResource("Presign");
    resource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(lambdaFunction),
      { apiKeyRequired: true }
    );

    const bucket = s3.Bucket.fromBucketName(this, "Bucket", config.bucketName);
    bucket.grantReadWrite(lambdaFunction);
    bucket.grantPut(lambdaFunction);

    // lambda role
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:*"],
        effect: iam.Effect.ALLOW,
        resources: presignArns, // lambda関数URLのARN
      })
    );
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        effect: iam.Effect.ALLOW,
        resources: ssmArns, // ssmのARN
      })
    );
  }
}
