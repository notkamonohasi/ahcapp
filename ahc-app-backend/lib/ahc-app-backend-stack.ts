import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Exec } from "./exec";
import { Tester } from "./tester";

export class AhcAppBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const tester = new Tester(this, "Tester", props);
    const exec = new Exec(
      this,
      "Exec",
      [tester.testerFunctionArn, tester.testerArnSsmArn],
      props
    );
    exec.node.addDependency(tester);
  }
}
