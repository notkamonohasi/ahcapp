import json
import os

import boto3
from const import TMP_DIR
from type import *

s3 = boto3.client("s3")

HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
}


def lambda_handler(event, _) -> HTTPResponce:
    """
    コード実行・点数計算を行う\n
    上位のlambdaから`boto3.Client().invoke()`で呼び出されることを想定
    """

    print(event)

    body: Body = event

    in_path = TMP_DIR.joinpath("in.txt")
    tester_path = TMP_DIR.joinpath("tester")
    binary_path = TMP_DIR.joinpath("main")
    out_path = TMP_DIR.joinpath("out.txt")
    score_path = TMP_DIR.joinpath("score.txt")

    # S3から必要なファイルをダウンロード
    try:
        bucket_name = body["bucketName"]
        s3.download_file(bucket_name, body["inPath"], str(in_path))
        s3.download_file(bucket_name, body["testerPath"], str(tester_path))
        s3.download_file(bucket_name, body["binaryPath"], str(binary_path))
    except Exception as e:
        message = {"abstract": "s3 download error", "message": str(e)}
        print(message)
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "isBase64Encoded": False,
            "body": json.dumps(message),
        }

    # ダウンロードしたバイナリには実行権限を付与する必要あり
    os.chmod(tester_path, 0o755)
    os.chmod(binary_path, 0o755)
    os.chmod(in_path, 0o755)

    def read_score() -> int:
        """
        `score_path`からscoreを読み取る
        """
        print("read score")
        with open(score_path, "r") as f:
            score = int(f.readline().replace("\n", "").split(" ")[-1])
            print(f"{score=}")
        return score

    # 実行
    # boolがstrになっている...
    if body["isInteractive"] == "false":
        print("non interactive")
        try:
            os.chmod(binary_path, 0o755)
            exec_result = os.system(f"{binary_path} < {in_path} > {out_path}")
            assert exec_result == 0
        except Exception as e:
            message = {"abstract": "execution error", "message": str(e)}
            print(message)
            return {
                "statusCode": 500,
                "headers": HEADERS,
                "isBase64Encoded": False,
                "body": json.dumps(message),
            }

        # 点数
        # cargo run -r --bin vis in/${i}.txt out/${i}.txt
        try:
            test_result = os.system(
                f"{tester_path} {in_path} {out_path} > {score_path}"
            )
            score = read_score()
            assert test_result == 0
        except Exception as e:
            message = {"abstract": "test error", "message": str(e)}
            print(message)
            return {
                "statusCode": 500,
                "headers": HEADERS,
                "isBase64Encoded": False,
                "body": json.dumps(message),
            }
    else:
        # 実行 & 点数
        # cargo run -r --bin tester ./tmp_main < in/${i}.txt > out/${i}.txt 2> hoge.txt
        print("interactive")
        try:
            test_result = os.system(
                f"{tester_path} {binary_path} < {in_path} > {out_path} 2> {score_path}"
            )
            score = read_score()
            assert test_result == 0
        except Exception as e:
            message = {"abstract": "test error", "message": str(e)}
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
        "body": json.dumps({"score": score}),
    }
