import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { createApi } from "./createApi";
import { Exec } from "./exec";
import { InputAnalyzer } from "./inputAnalyzer";
import { Tester } from "./tester";

export class AhcAppBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const api = createApi(this);
    const tester = new Tester(this, "Tester", props);
    const exec = new Exec(
      this,
      "Exec",
      [tester.testerFunctionArn, tester.testerArnSsmArn],
      api,
      props
    );
    const inputAnalyzer = new InputAnalyzer(this, "InputAnalyzer", api, props);
  }
}
