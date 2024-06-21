import os

import dotenv
import requests

dotenv.load_dotenv(".env")

url = os.environ["EXEC_URL"]
api_key = os.environ["EXEC_API_KEY"]
print(url, api_key)

res = requests.get(url, headers={"x-api-key": api_key})
print(res.text)
