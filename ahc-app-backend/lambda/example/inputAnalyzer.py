import json
import sys
from pathlib import Path


def analyze_input() -> dict:
    W, D, N = map(int, input().split())
    return {"W": W, "D": D, "N": N}


if __name__ == "__main__":
    result = analyze_input()

    result_path = Path(sys.argv[1])
    with open(result_path, "w") as f:
        json.dump(result, f)
