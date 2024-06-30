import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export const createApi = (scope: Construct) => {
  const api = new apigateway.RestApi(scope, "Api", {
    defaultCorsPreflightOptions: {
      allowOrigins: ["*"],
    },
  });
  const apiKey = api.addApiKey("ApiKey", { apiKeyName: "AhcAppApiKey" });
  const usagePlan = api.addUsagePlan("ApiUsagePlan");
  usagePlan.addApiKey(apiKey);
  usagePlan.addApiStage({
    stage: api.deploymentStage,
  });

  return api;
};
