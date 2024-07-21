from typing import TypedDict


class HTTPResponce(TypedDict):
    statusCode: int
    headers: dict
    isBase64Encoded: bool
    body: str


class Body(TypedDict):
    bucketName: str
    binaryPath: str
    inPath: str
    testerPath: str
    isInteractive: str
