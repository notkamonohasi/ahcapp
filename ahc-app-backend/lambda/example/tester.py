import random
import sys

if __name__ == "__main__":
    argv = sys.argv
    print(argv)
    in_path = argv[1]
    out_path = argv[2]
    score_path = argv[3]

    with open(score_path, "w") as f:
        f.write(str(random.randint(0, 10000)))
