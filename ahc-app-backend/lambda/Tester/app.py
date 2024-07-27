import json
import os
import subprocess
import threading
from typing import Callable, Final

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

    def run_with_timeout(cmd: str, timeout: float) -> int:
        def target():
            try:
                result["returncode"] = subprocess.run(
                    cmd, shell=True, check=True, capture_output=True
                ).returncode
            except subprocess.CalledProcessError as e:
                result["error"] = e

        result = {}  # type: ignore
        thread = threading.Thread(target=target)
        thread.start()
        thread.join(timeout)

        if thread.is_alive():
            # Timeout reached; terminate the process
            subprocess.run(f'pkill -f "{cmd}"', shell=True)
            thread.join()
            raise Exception("Function execution exceeded the time limit")

        if "error" in result:
            raise result["error"]

        print(f"{result=}")
        return result["returncode"]

    def read_score() -> int:
        """
        `score_path`からscoreを読み取る
        """
        print("read score")
        with open(score_path, "r") as f:
            print(f.readlines())
        with open(score_path, "r") as f:
            score = int(f.readline().replace("\n", "").split(" ")[-1])
            print(f"{score=}")
        return score

    # 実行
    # boolがstrになっている...
    if body["isInteractive"] == "false":
        print("non interactive")
        try:
            command = f"{binary_path} < {in_path} > {out_path}"
            print(f"{command=}")
            exec_result = run_with_timeout(command, float(body["timeLimit"]) + 1.0)
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
            command = (
                f"{tester_path} {binary_path} < {in_path} > {out_path} 2> {score_path}"
            )
            print(f"{command=}")
            timeLimit = float(body["timeLimit"]) + 1.0
            print(f"{timeLimit=}")
            exec_result = run_with_timeout(command, timeLimit)
            print(f"{exec_result=}")
            assert exec_result == 0
            score = read_score()
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
