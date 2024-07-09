import { faFileAlt, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Typography } from "@mui/material";
import * as Storage from "aws-amplify/storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Loader from "react-spinners/BeatLoader";
import awsmobile from "../../aws-exports";
import BasicTable from "../../components/BasicTable";
import "../style.css";
import { AnyObject } from "../type";
import * as utils from "../utils";
import BrowseModal from "./BrowseModal";
import { Commit } from "./type";

const ApiUrl = process.env.REACT_APP_API_URL!;
const ApiKey = process.env.REACT_APP_API_KEY!;
const calculationUrl = `${ApiUrl}/Exec`;
const inputAnalyzerUrl = `${ApiUrl}/InputAnalyzer`;
const resultHandlerUrl = `${ApiUrl}/ResultHandler`;

function CodeTestExecutor() {
  const queryParams = new URLSearchParams(window.location.search);
  const contestName = queryParams.get("contest")!;
  const contestPath = `${utils.contestsPath}/${contestName}`;
  const bucketName = awsmobile.aws_user_files_s3_bucket;
  const codePath = `${contestPath}/main.cpp`;
  const allCodePath = `${contestPath}/allCode`;
  const commitPath = `${contestPath}/commit.json`;
  const inPath = `${contestPath}/in`;
  const testerPath = `${contestPath}/tester.py`;
  const inputAnalyzerPath = `${contestPath}/inputAnalyzer.py`;
  const inputAnalyzeResultPath = `${contestPath}/inputAnalyzeResult.json`;
  const targetResultScorePath = `${contestPath}/targetResultScore.json`;
  const allResultPath = `${contestPath}/allResult.csv`;
  const testSize = 10;

  const [isInUploading, setIsInUploading] = useState<boolean>(false);
  const [isCodeUploading, setIsCodeUploading] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isInputAnalyzing, setIsInputAnalyzing] = useState<boolean>(false);
  const [isTesterUploading, setIsTesterUploading] = useState<boolean>(false);
  const [isInputAnalyzerUploading, setIsInputAnalyzerUploading] =
    useState<boolean>(false);
  const [isCodeUploaded, setIsCodeUploaded] = useState<boolean>(false);
  const [isInUploaded, setIsInUploaded] = useState<boolean>(false);
  const [isTesterUploaded, setIsTesterUploaded] = useState<boolean>(false);
  const [isInputAnalyzerUploaded, setIsInputAnalyzerUploaded] =
    useState<boolean>(false);
  const [isResultSaving, setIsResultSaving] = useState<boolean>(false);
  const [isTargetResultSaving, setIsTargetResultSaving] =
    useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalPath, setModalPath] = useState<string | undefined>();
  const [scores, setScores] = useState<number[] | undefined>();
  const [targetScores, setTargetScores] = useState<number[] | undefined>();
  const [codeFile, setCodeFile] = useState<File | undefined>();
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [lastCalcTime, setLastCalcTime] = useState<string | undefined>();
  const [inputAnalyzeResults, setInputAnalyzeResults] = useState<
    AnyObject[] | undefined
  >();
  const [mergedResult, setMergedResult] = useState<AnyObject[] | undefined>();

  const handleInUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsInUploading(true);
    const files = event.target.files!;

    const f = async () => {
      if (files.length > 3000) {
        throw new Error("uploadするファイル数が3000個を超えています");
      }
      let fileSizeSum = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileSizeSum += file.size;
      }
      if (fileSizeSum > 10 * 1024 * 1024) {
        throw new Error("uploadするファイルの合計が10MBを超えています");
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${inPath}/${file.name.split("/").at(-1)}`;
        if (file.size > 0.1 * 1024 * 1024) {
          throw new Error("uploadするファイルが0.1MBを超えています");
        }
        Storage.uploadData({ path: path, data: file });
        console.log(path);
      }
    };
    await f();
    setIsInUploading(false);
  };

  const handleTesterUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsTesterUploading(true);
    const file = event.target.files![0];

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("uploadするファイルが10MBを超えています");
    }

    try {
      await Storage.uploadData({ path: testerPath, data: file }).result;
      console.log("tester upload done");
      setIsTesterUploaded(true);
    } catch (error) {
      console.log(error);
    }

    setIsTesterUploading(false);
  };

  const handleInputAnalyzerUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsInputAnalyzerUploading(true);
    const file = event.target.files![0];

    if (file.size > 1 * 1024 * 1024) {
      throw new Error("uploadするファイルが1MBを超えています");
    }

    try {
      await Storage.uploadData({ path: inputAnalyzerPath, data: file }).result;
      console.log("inputAnalyzer upload done");
      setIsInputAnalyzerUploaded(true);
    } catch (error) {
      console.log(error);
    }

    setIsInputAnalyzerUploading(false);
  };

  const handleCodeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsCodeUploading(true);
    const file = event.target.files![0];
    try {
      const result = await Storage.uploadData({ path: codePath, data: file })
        .result;
      console.log("code upload done");
      setCodeFile(file);
      setIsCodeUploaded(true);
    } catch (error) {
      console.log(error);
    }
    setIsCodeUploading(false);
  };

  const checkIsInUploaded = async () => {
    // FIXME: ディレクトリは探索できないので、0000.txtを探す様にする
    try {
      const result = await Storage.getProperties({
        path: inPath + "/0000.txt",
      });
      console.log(result);
      setIsInUploaded(true);
    } catch {
      setIsInUploaded(false);
    }
  };
  useEffect(() => {
    checkIsInUploaded();
  }, []);
  const checkIsTesterUploaded = async () => {
    try {
      const result = await Storage.getProperties({ path: testerPath });
      console.log(result);
      setIsTesterUploaded(true);
    } catch {
      setIsTesterUploaded(false);
    }
  };
  useEffect(() => {
    checkIsTesterUploaded();
  }, []);
  const checkIsInputAnalyzerUploaded = async () => {
    try {
      const result = await Storage.getProperties({
        path: inputAnalyzeResultPath,
      });
      console.log(result);
      setIsInputAnalyzerUploaded(true);
    } catch {
      setIsInputAnalyzerUploaded(false);
    }
  };
  useEffect(() => {
    checkIsInputAnalyzerUploaded();
  }, []);

  const handleInputAnalyzeResultDownload = async () => {
    try {
      const { body, eTag } = await Storage.downloadData({
        path: inputAnalyzeResultPath,
      }).result;
      console.log(await body.text());
      const result = await JSON.parse(await body.text());
      console.log(result);
      setInputAnalyzeResults(result);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    handleInputAnalyzeResultDownload();
  }, []);

  const handleTargetScoreDownload = async () => {
    try {
      const { body, eTag } = await Storage.downloadData({
        path: targetResultScorePath,
      }).result;
      const result = await JSON.parse(await body.text());
      console.log(result["data"]);
      setTargetScores(result["data"]);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    handleTargetScoreDownload();
  }, []);

  const handleCalculation = async () => {
    setIsCalculating(true);
    const japanTime = utils.getJapanTime();
    setLastCalcTime(japanTime);
    var success = false;
    const result = await axios
      .get(calculationUrl, {
        headers: { "x-api-key": ApiKey },
        params: { bucketName, codePath, inPath, testerPath, testSize },
      })
      .catch((error) => {
        console.log(error);
      })
      .then((result) => {
        console.log(result);
        setScores(result!.data.scores!);
        success = true;
        return result;
      });

    // 保存
    const commit: Commit = {
      time: japanTime,
      success: success,
      codePath: `${allCodePath}/${japanTime}.cpp`,
      message: "none",
    };
    try {
      const codeResult = await Storage.uploadData({
        path: commit.codePath,
        data: codeFile!,
      }).result;
      console.log(codeResult);
      var commits: Record<string, Commit> = {};
      try {
        const { body, eTag } = await Storage.downloadData({ path: commitPath })
          .result;
        commits = await JSON.parse(await body.text());
      } catch (e) {
        console.log(e);
      }
      commits[japanTime] = commit;
      console.log(commits);

      const jsonString = JSON.stringify(commits);
      const blob = new Blob([jsonString], { type: "application/json" });
      const file = new File([blob], "targetScore.json", {
        type: "application/json",
      });
      const result = await Storage.uploadData({
        path: commitPath,
        data: file,
      }).result;
    } catch (e) {
      console.log(e);
    }

    setIsCalculating(false);
  };

  const mergeResult = async () => {
    if (!scores) return;
    const keys = !inputAnalyzeResults
      ? []
      : Object.keys(inputAnalyzeResults[0]);
    var result: AnyObject[] = [];
    console.log(inputAnalyzeResults);
    console.log(scores);
    for (var i = 0; i < scores.length; i++) {
      var one: AnyObject = {};
      if (!inputAnalyzeResults || i >= inputAnalyzeResults.length) {
        keys.map((key) => {
          one[key] = undefined;
        });
      } else {
        keys.map((key) => {
          try {
            one[key] = inputAnalyzeResults![i][key];
          } catch {
            one[key] = undefined;
          }
        });
      }

      if (targetScores && targetScores.length > i) one["Baseline"] = scores[i];
      one["Score"] = scores[i];

      result = [...result, one];
    }

    setMergedResult(result);
  };
  useEffect(() => {
    mergeResult();
  }, [scores, inputAnalyzeResults]);

  const handleExecInputAnalyze = async () => {
    setIsInputAnalyzing(true);
    console.log(inputAnalyzerUrl, ApiKey);
    const result = await axios
      .get(inputAnalyzerUrl, {
        headers: { "x-api-key": ApiKey },
        params: {
          bucketName,
          inPath,
          inputAnalyzerPath,
          inputAnalyzeResultPath,
        },
      })
      .catch((error) => {
        console.log(error);
      })
      .then((result) => {
        console.log(result);
        return result;
      });
    setIsInputAnalyzing(false);
    await handleInputAnalyzeResultDownload();
    console.log(inputAnalyzeResults);
  };

  const handleSaveResult = async () => {
    setIsResultSaving(true);
    console.log(scores);
    await axios
      .post(
        resultHandlerUrl,
        {
          bucketName,
          inputAnalyzeResultPath,
          allResultPath,
          scores: scores,
          colName: lastCalcTime,
        },
        {
          headers: { "x-api-key": ApiKey },
        }
      )
      .catch((error) => {
        console.log(error);
      })
      .then((result) => {
        console.log(result);
        return result;
      });
    setIsResultSaving(false);
  };

  const handleSaveTargetResult = async () => {
    setIsTargetResultSaving(true);
    try {
      const jsonString = JSON.stringify({ data: scores! });
      const blob = new Blob([jsonString], { type: "application/json" });
      const file = new File([blob], "targetScore.json", {
        type: "application/json",
      });
      const result = await Storage.uploadData({
        path: targetResultScorePath,
        data: file,
      }).result;
      console.log(result);
      console.log("code upload done");
      setIsCodeUploaded(true);
    } catch (error) {
      console.log(error);
    }
    setIsTargetResultSaving(false);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px dashed grey",
      }}
    >
      <BrowseModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        path={modalPath}
      />
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          border: "1px dashed blue",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Commons
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            border: "1px dashed grey",
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              width: "33.33%",
              display: "flex",
              flexDirection: "column",
              border: "1px dashed grey",
            }}
          >
            <Typography variant="h6" gutterBottom>
              TestCase
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: "5%",
                paddingLeft: "10%",
                paddingRight: "10%",
                border: "1px dashed grey",
              }}
            >
              <Button
                variant="contained"
                component="label"
                sx={{
                  flex: 1,
                }}
              >
                {isInUploading ? (
                  <Loader />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} />
                    &thinsp; Upload
                  </>
                )}
                <input
                  type="file"
                  /* @ts-expect-error */
                  directory=""
                  webkitdirectory="true"
                  multiple
                  hidden
                  onChange={handleInUpload}
                  disabled={isInUploading}
                />
              </Button>
              <Button
                variant="contained"
                component="label"
                sx={{
                  flex: 1,
                }}
                onClick={() => {
                  alert("未対応");
                }}
                disabled={!isInUploaded}
              >
                <FontAwesomeIcon icon={faFileAlt} />
                &thinsp; Browse
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              textAlign: "center",
              width: "33.33%",
              flexDirection: "column",
              border: "1px dashed grey",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Tester
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: "5%",
                paddingLeft: "10%",
                paddingRight: "10%",
                border: "1px dashed grey",
              }}
            >
              <Button
                variant="contained"
                component="label"
                sx={{ flex: 1 }}
                disabled={isTesterUploading}
              >
                <FontAwesomeIcon icon={faUpload} />
                &thinsp; Upload
                <input
                  type="file"
                  accept=".py"
                  hidden
                  onChange={handleTesterUpload}
                />
              </Button>
              <Button
                variant="contained"
                component="label"
                sx={{ flex: 1 }}
                onClick={() => {
                  setIsModalOpen(true);
                  setModalPath(testerPath);
                }}
                disabled={!isTesterUploaded}
              >
                <FontAwesomeIcon icon={faFileAlt} />
                &thinsp; Browse
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              textAlign: "center",
              width: "33.33%",
              display: "flex",
              flexDirection: "column",
              border: "1px dashed grey",
            }}
          >
            <Typography variant="h6" gutterBottom>
              InputAnalyzer
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: "5%",
                paddingLeft: "10%",
                paddingRight: "10%",
                border: "1px dashed grey",
              }}
            >
              <Button
                variant="contained"
                component="label"
                sx={{ flex: 1 }}
                disabled={isInputAnalyzerUploading}
              >
                <FontAwesomeIcon icon={faUpload} />
                &thinsp; Upload
                <input
                  type="file"
                  accept=".py"
                  hidden
                  onChange={handleInputAnalyzerUpload}
                />
              </Button>
              <Button
                variant="contained"
                component="label"
                sx={{ flex: 1 }}
                onClick={() => {
                  setIsModalOpen(true);
                  setModalPath(inputAnalyzerPath);
                }}
                disabled={!isInputAnalyzerUploaded}
              >
                <FontAwesomeIcon icon={faFileAlt} />
                &thinsp; Browse
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          border: "1px dashed blue",
          paddingTop: "50px",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Exec
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            border: "1px dashed grey",
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              width: "50%",
              display: "flex",
              flexDirection: "column",
              border: "1px dashed grey",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Main
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: "5%",
                border: "1px dashed green",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  minWidth: "33.33%",
                }}
              >
                <Button variant="contained" component="label" sx={{ flex: 1 }}>
                  <FontAwesomeIcon icon={faUpload} />
                  &thinsp; UPLOAD
                  <input
                    type="file"
                    accept=".cpp"
                    hidden
                    onChange={handleCodeUpload}
                    disabled={isCodeUploading}
                  />
                </Button>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  minWidth: "33.33%",
                }}
              >
                <Button
                  variant="contained"
                  component="label"
                  sx={{
                    flex: 1,
                  }}
                  onClick={handleCalculation}
                  disabled={
                    !isCodeUploaded ||
                    isCalculating ||
                    isCodeUploading ||
                    isInUploading ||
                    isTesterUploading
                  }
                >
                  {isCalculating ? <Loader /> : "start"}
                </Button>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              textAlign: "center",
              width: "50%",
              display: "flex",
              flexDirection: "column",
              border: "1px dashed grey",
            }}
          >
            <Typography variant="h6" gutterBottom>
              InputAnalyzer
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                border: "1px dashed green",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  minWidth: "33.33%",
                }}
              >
                <Button
                  variant="contained"
                  component="label"
                  sx={{
                    flex: 1,
                  }}
                  onClick={handleExecInputAnalyze}
                  disabled={
                    !isTesterUploaded ||
                    isTesterUploading ||
                    !isInputAnalyzerUploaded ||
                    isInputAnalyzerUploading ||
                    isInputAnalyzing
                  }
                >
                  {isInputAnalyzing ? <Loader /> : "start"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          border: "1px dashed blue",
          paddingTop: "50px",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Result
        </Typography>
        <Box
          sx={{
            width: "60%",
            display: "flex",
            border: "1px dashed green",
            paddingLeft: "5%",
            paddingRight: "5%",
            gap: "10%",
          }}
        >
          {mergedResult ? (
            <>
              <Button
                variant="contained"
                component="label"
                sx={{
                  flex: 1,
                }}
                onClick={handleSaveResult}
                disabled={isResultSaving}
              >
                {isResultSaving ? <Loader /> : "save"}
              </Button>
              <Button
                variant="contained"
                component="label"
                sx={{
                  flex: 1,
                }}
                onClick={handleSaveTargetResult}
                disabled={isTargetResultSaving}
              >
                {isTargetResultSaving ? <Loader /> : "save as baseline"}
              </Button>
            </>
          ) : undefined}
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            border: "1px dashed green",
            paddingLeft: "5%",
            paddingRight: "5%",
            paddingTop: "5px",
            paddingBottom: "20px",
          }}
        >
          {mergedResult ? <BasicTable values={mergedResult!} /> : ""}
        </Box>
      </Box>
    </Box>
  );
}

export default CodeTestExecutor;
