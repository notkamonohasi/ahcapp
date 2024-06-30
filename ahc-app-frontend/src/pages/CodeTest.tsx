import { Box, Button, Typography } from "@mui/material";
import * as Storage from "aws-amplify/storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Loader from "react-spinners/BeatLoader";
import awsmobile from "../aws-exports";
import BasicTable from "../components/BasicTable";
import "./style.css";
import { AnyObject } from "./type";
import * as utils from "./utils";

const ApiUrl = process.env.REACT_APP_API_URL!;
const ApiKey = process.env.REACT_APP_API_KEY!;
const calculationUrl = `${ApiUrl}/Exec`;
const inputAnalyzerUrl = `${ApiUrl}/InputAnalyzer`;

function CodeTest() {
  const queryParams = new URLSearchParams(window.location.search);
  const contestName = queryParams.get("contest")!;
  const contestPath = `${utils.contestsPath}/${contestName}`;
  const bucketName = awsmobile.aws_user_files_s3_bucket;
  const codePath = `${contestPath}/main.cpp`;
  const inPath = `${contestPath}/in`;
  const testerPath = `${contestPath}/tester.py`;
  const inputAnalyzerPath = `${contestPath}/inputAnalyzer.py`;
  const inputAnalyzeResultPath = `${contestPath}/inputAnalyzeResult.json`;
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
  const [scores, setScores] = useState<number[] | undefined>();
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

  const handleTesterDownload = async () => {
    try {
      const { body, eTag } = await Storage.downloadData({ path: testerPath })
        .result;
      const url = URL.createObjectURL(await body.blob());
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tester.py");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.log(error);
    }
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

  const handleInputAnalyzerDownload = async () => {
    try {
      const { body, eTag } = await Storage.downloadData({
        path: inputAnalyzerPath,
      }).result;
      const url = URL.createObjectURL(await body.blob());
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "inputAnalyzer.py");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCodeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsCodeUploading(true);
    const file = event.target.files![0];
    try {
      const result = await Storage.uploadData({ path: codePath, data: file })
        .result;
      console.log(result);
      console.log("code upload done");
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

  const handleCalculation = async () => {
    setIsCalculating(true);
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
        return result;
      });
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

  return (
    <Box
      sx={{
        minWidth: "800px",
        display: "flex",
        flexDirection: "column",
        border: "1px dashed grey",
      }}
    >
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
                padding: "5%",
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
                {isInUploading ? <Loader /> : "UPLOAD"}
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
                Download
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
                padding: "5%",
                border: "1px dashed grey",
              }}
            >
              <Button
                variant="contained"
                component="label"
                sx={{ flex: 1 }}
                disabled={isTesterUploading}
              >
                Upload
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
                onClick={handleTesterDownload}
                disabled={!isTesterUploaded}
              >
                Download
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
                padding: "5%",
                border: "1px dashed grey",
              }}
            >
              <Button
                variant="contained"
                component="label"
                sx={{ flex: 1 }}
                disabled={isInputAnalyzerUploading}
              >
                Upload
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
                onClick={handleInputAnalyzerDownload}
                disabled={!isInputAnalyzerUploaded}
              >
                Download
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
                  UPLOAD
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
            width: "100%",
            display: "flex",
            border: "1px dashed green",
            paddingLeft: "5%",
            paddingRight: "5%",
          }}
        >
          {mergedResult ? <BasicTable values={mergedResult!} /> : ""}
        </Box>
      </Box>
    </Box>
  );
}

export default CodeTest;
