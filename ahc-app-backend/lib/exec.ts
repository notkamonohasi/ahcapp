import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { config } from "./config";
import { createLambdaFunctionFromDocker } from "./createLambda";

export class Exec extends Construct {
  constructor(
    scope: Construct,
    id: string,
    arns: string[],
    props?: cdk.StackProps
  ) {
    super(scope, id);

    // C++をコンパイルするため、g++が必要
    const lambdaFunction = createLambdaFunctionFromDocker(
      this,
      "Exec",
      1024,
      1,
      "develop"
    );

    const api = new apigateway.RestApi(this, "ExecApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
      },
    });
    const apiKey = api.addApiKey("ExecApiKey");
    const resource = api.root.addResource("Exec");
    resource.addMethod("GET", new apigateway.LambdaIntegration(lambdaFunction));

    const bucket = s3.Bucket.fromBucketName(this, "Bucket", config.bucketName);
    bucket.grantReadWrite(lambdaFunction);
    bucket.grantPut(lambdaFunction);

    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter", "lambda:InvokeFunction"],
        effect: iam.Effect.ALLOW,
        resources: arns,
      })
    );
  }
}
