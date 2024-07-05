import json

import boto3
import pandas as pd
from const import TMP_DIR
from type import Body, HTTPResponce

s3 = boto3.client("s3")

HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
}


def lambda_handler(event: dict, _) -> HTTPResponce:
    """
    データを結合する\n
    APIGatewayで呼び出されることを想定
    """

    print(f"{event=}")
    body: Body = json.loads(event["body"])
    print(f"{body=}")

    tmp_input_analyze_result_path = TMP_DIR.joinpath("input_analyze_result.json")
    tmp_all_result_path = TMP_DIR.joinpath("all_result.csv")
    tmp_after_result_path = TMP_DIR.joinpath("after_all_result.csv")
    first = False

    # download
    try:
        s3.download_file(
            body["bucketName"],
            body["inputAnalyzeResultPath"],
            str(tmp_input_analyze_result_path),
        )
    except Exception as e:
        message = {"abstract": "s3 download error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    # 初回だとない
    try:
        s3.download_file(
            body["bucketName"],
            body["allResultPath"],
            str(tmp_all_result_path),
        )
    except Exception as e:
        message = {"abstract": "s3 download error, but first is ok", "message": str(e)}
        print(message)
        first = True

    # 結合
    with open(tmp_input_analyze_result_path, "r") as f:
        js: dict = json.load(f)
        param_df = pd.DataFrame(js.values())
    if first:
        before_df = param_df
    else:
        before_df = pd.read_csv(tmp_all_result_path)
    new_df = pd.DataFrame(body["scores"], columns=[body["colName"]])

    row_size = max(len(param_df), len(before_df), len(new_df))

    if len(param_df) < row_size:
        param_df = param_df.reindex(range(row_size))
    if len(before_df) < row_size:
        before_df = before_df.reindex(range(row_size))
    if len(new_df) < row_size:
        new_df = new_df.reindex(range(row_size))

    columns = [col for col in before_df.columns if col not in param_df.columns]
    print(f"{columns=}")

    after_df = pd.concat([param_df, before_df[columns], new_df], axis=1)
    print(after_df)
    after_df.to_csv(tmp_after_result_path, index=False)

    # upload
    try:
        s3.upload_file(
            str(tmp_after_result_path),
            body["bucketName"],
            body["allResultPath"],
        )
    except Exception as e:
        message = {"abstract": "s3 upload error", "message": str(e)}
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
