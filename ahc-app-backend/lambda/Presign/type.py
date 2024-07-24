from typing import TypedDict


class HTTPResponce(TypedDict):
    statusCode: int
    headers: dict
    isBase64Encoded: bool
    body: str


class Body(TypedDict):
    methodName: str
    # **params: dict  // getのparam, 入れ子構造にできないため、この形式で入力
