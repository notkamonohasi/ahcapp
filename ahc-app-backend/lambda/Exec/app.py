import concurrent.futures
import json
import os
import random
from pathlib import Path
from typing import Optional

import boto3
from const import TMP_DIR
from type import *

s3 = boto3.client("s3")
ssm = boto3.client("ssm")
lambda_client = boto3.client("lambda")

HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
}
TESTER_ARN_SSM_PATH = "/ahcapp/testerArn"


def lambda_handler(event, _) -> HTTPResponce:
    """
    1. コンパイルを実行 -> S3に保存
    2. 複数のlambdaで並列計算
    3. 結果をまとめる
    """

    print(event)

    body: Body = event["queryStringParameters"]
    print(f"{body=}")

    code_path = TMP_DIR.joinpath("main.cpp")

    binary_path = TMP_DIR.joinpath("main")  # .cppのコンパイル結果
    s3_binary_path = "binary/" + str(random.randint(0, 10**10 - 1)).zfill(9)

    # arnを取得
    try:
        tester_arn = ssm.get_parameter(Name=TESTER_ARN_SSM_PATH, WithDecryption=True)[
            "Parameter"
        ]["Value"]
    except Exception as e:
        message = {"abstract": "s3 download error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    # S3から必要なファイルをダウンロード
    try:
        bucket_name = body["bucketName"]
        s3.download_file(bucket_name, body["codePath"], str(code_path))
    except Exception as e:
        message = {"abstract": "s3 download error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    # コンパイル
    try:
        compile_result = os.system(f"g++ -O3 -o {binary_path} {code_path}")
        assert compile_result == 0
    except Exception as e:
        message = {"abstract": "compile error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    # コンパイル結果をS3に保存
    try:
        s3.upload_file(str(binary_path), bucket_name, s3_binary_path)
    except Exception as e:
        message = {"abstract": "upload binary error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    # 並列計算
    def worker(n: int) -> Optional[int]:
        params: Params = {
            "binaryPath": str(s3_binary_path),
            "bucketName": body["bucketName"],
            "inPath": str(Path(body["inPath"]).joinpath(f"{str(n).zfill(4)}.txt")),
            "testerPath": body["testerPath"],
            "isInteractive": body["isInteractive"],
            "timeLimit": body["timeLimit"],
        }
        raw_res = lambda_client.invoke(
            FunctionName=tester_arn, Payload=json.dumps(params)
        )
        res: HTTPResponce = json.loads(raw_res["Payload"].read())
        if res["statusCode"] == 200:
            return json.loads(res["body"])["score"]
        else:
            print(f"test {n=} fail")
            return None

    test_size = int(body["testSize"])
    assert test_size <= 100
    with concurrent.futures.ThreadPoolExecutor(max_workers=test_size) as executor:
        futures = [executor.submit(worker, i) for i in range(test_size)]
        scores = [
            future.result() for future in concurrent.futures.as_completed(futures)
        ]
    print(scores)

    return {
        "statusCode": 200,
        "headers": HEADERS,
        "isBase64Encoded": False,
        "body": json.dumps({"scores": scores}),
    }
