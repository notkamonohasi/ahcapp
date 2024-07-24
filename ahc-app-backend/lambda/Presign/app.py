import json
from typing import Final

import boto3
from botocore.auth import SigV4QueryAuth
from botocore.awsrequest import AWSRequest
from botocore.credentials import create_credential_resolver
from botocore.session import Session
from type import Body, HTTPResponce

# SSMでの登録名
METHOD_MAP = {"Exec": "/ahcapp/exec"}

HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
}


def presign_for_lambda(url: str, body: str):
    """
    Lambdaの署名付きURLを発行する\n
    https://qiita.com/ShotaOki/items/2373bcaa9dabcb24e0da
    """

    SERVICE_NAME = "lambda"
    METHOD = "GET"
    EXPIRES = 300  # 署名の有効期限[s]

    session = Session()
    resolver = create_credential_resolver(session)
    credentials = resolver.load_credentials()
    request = AWSRequest(method=METHOD, url=url, data=body)
    SigV4QueryAuth(
        credentials=credentials,  # type: ignore
        service_name=SERVICE_NAME,
        region_name=session.get_config_variable("region"),
        expires=EXPIRES,
    ).add_auth(request)

    return request.url


def lambda_handler(event, _) -> HTTPResponce:
    print(event)

    body: Body = event["queryStringParameters"]

    try:
        method_name = body["methodName"]
        ssm_name = METHOD_MAP[method_name]
    except Exception as e:
        message = str(e)
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps({"message": message}),
        }

    url: str
    try:
        client = boto3.client("ssm")
        ssm_response = client.get_parameter(Name=ssm_name, WithDecryption=False)
        url = ssm_response["Parameter"]["Value"]
    except Exception as e:
        message = str(e)
        print(f"{message=}")
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps({"message": message}),
        }

    try:
        presigned_url = presign_for_lambda(
            url,
            json.dumps(body),
        )
    except Exception as e:
        message = str(e)
        print(f"{message=}")
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps({"message": message}),
        }

    print("presign success")
    return {
        "statusCode": 200,
        "headers": HEADERS,
        "isBase64Encoded": False,
        "body": json.dumps({"presignedUrl": presigned_url}),
    }
