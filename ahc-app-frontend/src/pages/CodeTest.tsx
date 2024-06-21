import * as Storage from "aws-amplify/storage";
import axios from "axios";
import React, { useState } from "react";
import Loader from "react-spinners/BeatLoader";
import awsmobile from "../aws-exports";
import "./style.css";

const apiUrl = process.env.REACT_APP_API_URL!;
const apiKey = process.env.REACT_APP_API_KEY!;

function CodeTest() {
  const bucketName = awsmobile.aws_user_files_s3_bucket;
  const codePath = "public/main.cpp";
  const inPath = "public/in";
  const testerPath = "public/tester.py";
  const testSize = 5;

  const [isCodeUploading, setIsCodeUploading] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const handleCodeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsCodeUploading(true);
    const file = event.target.files![0];
    try {
      const result = await Storage.uploadData({ path: codePath, data: file })
        .result;
      console.log(result);
    } catch (error) {
      console.log(error);
    }
    setIsCodeUploading(false);
  };

  const handleCalculation = async () => {
    setIsCalculating(true);
    const result = await axios
      .get(apiUrl, {
        headers: { "x-api-key": apiKey },
        params: { bucketName, codePath, inPath, testerPath, testSize },
      })
      .catch((error) => {
        console.log(error);
      })
      .then((result) => {
        console.log(result);
        return result;
      });
    setIsCalculating(false);
  };

  return (
    <div className="body">
      <input
        type="file"
        accept=".cpp"
        onChange={handleCodeUpload}
        disabled={isCodeUploading}
      />
      <br />
      <button onClick={handleCalculation}>
        {isCodeUploading || isCalculating ? <Loader /> : "start"}
      </button>
    </div>
  );
}

export default CodeTest;
