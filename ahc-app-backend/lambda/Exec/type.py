from typing import TypedDict


class HTTPResponce(TypedDict):
    statusCode: int
    headers: dict
    isBase64Encoded: bool
    body: str


class Body(TypedDict):
    bucketName: str
    codePath: str
    inPath: str
    testerPath: str
    testSize: int
    isInteractive: bool
    timeLimit: float


class Params(TypedDict):
    bucketName: str
    binaryPath: str
    inPath: str
    testerPath: str
    isInteractive: bool
    timeLimit: float
