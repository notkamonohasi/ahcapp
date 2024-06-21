import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { config } from "./config";
import { createLambdaFunction } from "./createLambda";

export class Tester extends Construct {
  readonly testerFunctionArn: string;
  readonly testerArnSsmArn: string;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    const lambdaFunction = createLambdaFunction(
      this,
      "Tester",
      1024,
      1,
      "develop"
    );
    this.testerFunctionArn = lambdaFunction.functionArn;

    const testerArnSsm = new ssm.StringParameter(this, "TesterArn", {
      parameterName: "/ahcapp/testerArn",
      stringValue: lambdaFunction.functionArn,
    });
    this.testerArnSsmArn = testerArnSsm.parameterArn;

    const bucket = s3.Bucket.fromBucketName(this, "Bucket", config.bucketName);
    bucket.grantReadWrite(lambdaFunction);
    bucket.grantPut(lambdaFunction);
  }
}
