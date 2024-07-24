import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { config } from "./config";
import { getAllowedOrigins } from "./cors";
import { createLambdaFunctionFromDocker } from "./createLambda";

export class Exec extends Construct {
  public readonly lambdaFunctionUrlArn: string;
  public readonly lambdaFunctionUrlSsmArn: string;

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

    // 関数URL
    const lambdaFunctionUrl = lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: getAllowedOrigins(props),
        allowedHeaders: ["*"],
      },
    });
    this.lambdaFunctionUrlArn = lambdaFunctionUrl.functionArn;

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

    const lambdaFunctionUrlSsm = new ssm.StringParameter(
      this,
      "ExecLambdaFunctionUrl",
      {
        parameterName: `/ahcapp/exec`,
        stringValue: lambdaFunctionUrl.url,
      }
    );
    this.lambdaFunctionUrlSsmArn = lambdaFunctionUrlSsm.parameterArn;
  }
}
