import { faFileAlt, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Switch, TextField, Typography } from "@mui/material";
import * as Storage from "aws-amplify/storage";
import axios from "axios";
import { useEffect, useState } from "react";
import Loader from "react-spinners/BeatLoader";
import awsmobile from "../../aws-exports";
import BasicTable from "../../components/BasicTable";
import { presignLambdaGet } from "../../components/Lambda";
import {
  useS3Check,
  useS3DirUpload,
  useS3Download,
  useS3Upload,
} from "../../components/S3";
import "../style.css";
import { AnyObject } from "../type";
import * as utils from "../utils";
import BrowseModal from "./BrowseModal";
import { Commit } from "./type";

const DEFAULT_TEST_SIZE = 10;

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
  const testerPath = `${contestPath}/tester`;
  const inputAnalyzerPath = `${contestPath}/inputAnalyzer.py`;
  const inputAnalyzeResultPath = `${contestPath}/inputAnalyzeResult.json`;
  const targetResultScorePath = `${contestPath}/targetResultScore.json`;
  const allResultPath = `${contestPath}/allResult.csv`;

  const [isInteractive, setIsInteractive] = useState<boolean>(false);

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isInputAnalyzing, setIsInputAnalyzing] = useState<boolean>(false);
  const [isResultSaving, setIsResultSaving] = useState<boolean>(false);
  const [isTargetResultSaving, setIsTargetResultSaving] =
    useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalPath, setModalPath] = useState<string | undefined>();

  const [testSize, setTestSize] = useState<number>(DEFAULT_TEST_SIZE);
  const [scores, setScores] = useState<number[] | undefined>();
  const [targetScores, setTargetScores] = useState<number[] | undefined>();
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [lastCalcTime, setLastCalcTime] = useState<string | undefined>();
  const [mergedResult, setMergedResult] = useState<AnyObject[] | undefined>();

  const {
    handleS3Upload: handleTesterUpload,
    isS3Uploading: isTesterUploading,
    isS3Uploaded: isTesterUploaded,
  } = useS3Upload(testerPath, 3);
  const {
    handleS3Upload: handleInputAnalyzerUpload,
    isS3Uploading: isInputAnalyzerUploading,
    isS3Uploaded: isInputAnalyzerUploaded,
  } = useS3Upload(inputAnalyzerPath, 1);
  const {
    handleS3Upload: handleCodeUpload,
    isS3Uploading: isCodeUploading,
    isS3Uploaded: isCodeUploaded,
    file: codeFile,
  } = useS3Upload(codePath, 3);
  const {
    handleS3Check: handleTesterCheck,
    isS3Checking: isTesterChecking,
    isS3Uploaded: isPreTesterUploaded,
  } = useS3Check(testerPath);
  const {
    handleS3Check: handleInputAnalyzerCheck,
    isS3Checking: isInputAnalyzerChecking,
    isS3Uploaded: isPreInputAnalyzerUploaded,
  } = useS3Check(inputAnalyzerPath);
  const {
    handleS3Check: handleInCheck,
    isS3Checking: isInChecking,
    isS3Uploaded: isPreInUploaded,
  } = useS3Check(inPath + "/0000.txt"); // ディレクトリは探索できないので代わりを探す
  const {
    handleS3Upload: handleInUpload,
    isS3Uploading: isInUploading,
    isS3Uploaded: isInUploaded,
  } = useS3DirUpload(inPath, 10, 3000);
  const {
    handleS3Download: handleInputAnalyzeResultDownload,
    json: inputAnalyzeResults,
  } = useS3Download(inputAnalyzeResultPath, true) as {
    handleS3Download: () => Promise<boolean>;
    json: AnyObject[] | undefined;
  };

  useEffect(() => {
    handleTesterCheck();
    handleInputAnalyzerCheck();
    handleInCheck();
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
    const result = await presignLambdaGet("Exec", {
      bucketName,
      codePath,
      inPath,
      testerPath,
      testSize,
      isInteractive,
    });
    setIsCalculating(false);

    const success = result.success;
    if (success === true) setScores(result.result!.scores!);

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
    } catch (error) {
      console.log(error);
    }
    setIsTargetResultSaving(false);
  };

  if (isInChecking || isTesterChecking || isInputAnalyzerChecking)
    return <Loader />;
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
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
        }}
      >
        <Typography variant="h5" gutterBottom>
          Commons
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              width: "33.33%",
              display: "flex",
              flexDirection: "column",
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
                disabled={!isPreInUploaded && !isInUploaded}
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
                <input type="file" hidden onChange={handleTesterUpload} />
              </Button>
              <Button
                variant="contained"
                component="label"
                sx={{ flex: 1 }}
                onClick={() => {
                  alert("binaryです");
                }}
                disabled={!isPreTesterUploaded && !isTesterUploaded}
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
                disabled={
                  !isPreInputAnalyzerUploaded && !isInputAnalyzerUploaded
                }
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
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              width: "75%",
              display: "flex",
              flexDirection: "column",
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
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Switch
                  checked={isInteractive}
                  onChange={(event) => setIsInteractive(event.target.checked)}
                />
                <Typography>Interactive</Typography>
              </Box>
              <TextField
                value={testSize}
                type="number"
                label="testSize"
                onChange={(event) => setTestSize(Number(event.target.value))}
                InputProps={{
                  style: {
                    height: "40px",
                  },
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  minWidth: "25%",
                  height: "40px",
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
                  minWidth: "25%",
                  height: "40px",
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
              width: "33.33%",
              display: "flex",
              flexDirection: "column",
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
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  minWidth: "50%",
                  height: "40px",
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
                    (!isTesterUploaded && !isPreTesterUploaded) ||
                    isTesterUploading ||
                    (!isInputAnalyzerUploaded && !isPreInputAnalyzerUploaded) ||
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
