import * as cdk from "aws-cdk-lib";

export const getAllowedOrigins = (props?: cdk.StackProps): string[] => {
  let allowedOrigins: string[] = [
    "http://localhost:3000",
    "https://master.d2cfofc9ngi8as.amplifyapp.com",
  ];
  return allowedOrigins;
};
