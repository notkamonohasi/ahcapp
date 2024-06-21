import * as cdk from "aws-cdk-lib";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export const createLambdaFunction = (
  scope: Construct,
  dirName: string,
  memorySize: number,
  timeout: number,
  environment: string
): lambda.DockerImageFunction => {
  return new lambda.DockerImageFunction(scope, `${dirName}Function`, {
    functionName: dirName,
    code: lambda.DockerImageCode.fromImageAsset("lambda", {
      buildArgs: {
        LAMBDA_FOLDER: dirName,
      },
      file: `${dirName}/Dockerfile`,
      platform: Platform.LINUX_AMD64,
      exclude: ["*.csv", "*.png", "*.pkl"],
    }),
    logGroup: new logs.LogGroup(scope, `${dirName}Log`, {
      logGroupName: `/ahcapp/${environment}/${dirName}`,
      retention: logs.RetentionDays.ONE_MONTH,
    }),
    timeout: cdk.Duration.minutes(timeout),
    memorySize: memorySize,
    architecture: lambda.Architecture.X86_64,
  });
};
