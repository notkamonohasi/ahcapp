from typing import TypedDict


class HTTPResponce(TypedDict):
    statusCode: int
    headers: dict
    isBase64Encoded: bool
    body: str


class Body(TypedDict):
    bucketName: str
    inPath: str
    inputAnalyzerPath: str
    inputAnalyzeResultPath: str
