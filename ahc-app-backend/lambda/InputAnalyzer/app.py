import json
import os
from typing import Final

import boto3
from const import TMP_DIR
from type import *

MAX_DOWNLOAD_SIZE = 1000

s3 = boto3.client("s3")

HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
}


def lambda_handler(event, _) -> HTTPResponce:
    """
    テストケースのパラメータを計算する\n
    計算するPythonはsys.argv[1]に置いた出力ファイルにjson形式でパラメータを書き込む\n
    APIGatewayで呼び出されることを想定
    """

    print(event)

    body: Body = event["queryStringParameters"]

    in_dir = TMP_DIR.joinpath("in")
    input_analyzer_path = TMP_DIR.joinpath("app.py")

    if in_dir.exists() is False:
        in_dir.mkdir()

    tmp_out_path = TMP_DIR.joinpath("out.json")

    # S3からpythonコードをダウンロード
    try:
        s3.download_file(
            body["bucketName"], body["inputAnalyzerPath"], str(input_analyzer_path)
        )
    except Exception as e:
        message = {"abstract": "inputAnalyzer download error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    # S3からダウンロード & 実行
    data: dict[int, dict] = {}
    for i in range(MAX_DOWNLOAD_SIZE):
        s = str(i).zfill(4) + ".txt"
        path = body["inPath"] + "/" + s
        my_path = str(in_dir.joinpath(s))
        try:
            s3.download_file(body["bucketName"], path, my_path)
        except Exception as e:
            print(str(e))
            print(f"number={i}")
            break
        try:
            res = os.system(f"python3 {input_analyzer_path} {tmp_out_path} < {my_path}")
            assert res == 0
        except Exception as e:
            message = {"abstract": "inputAnalyzer execution error", "message": str(e)}
            print(message)
            return {
                "statusCode": 500,
                "headers": HEADERS,
                "isBase64Encoded": False,
                "body": json.dumps(message),
            }

        with open(tmp_out_path, "r") as f:
            data[i] = json.load(f)

    # S3に結果を置く
    with open(tmp_out_path, "w") as f:
        json.dump(data, f, indent=4)
    try:
        s3.upload_file(
            str(tmp_out_path), body["bucketName"], str(body["inputAnalyzeResultPath"])
        )
    except Exception as e:
        message = {"abstract": "result upload error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    return {
        "statusCode": 200,
        "headers": HEADERS,
        "isBase64Encoded": False,
        "body": json.dumps({"success": True}),
    }
