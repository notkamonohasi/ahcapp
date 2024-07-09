import { Loader } from "@aws-amplify/ui-react";
import { Box } from "@mui/material";
import csvtojson from "csvtojson";
import { useEffect, useState } from "react";
import BasicTable from "../../components/BasicTable";
import { useS3Download } from "../../components/S3";
import "../style.css";
import { AnyObject } from "../type";
import * as utils from "../utils";
import BrowseModal from "./BrowseModal";
import { Commit } from "./type";

export interface CommitObject {
  [key: string]: Commit;
}

function ResultAnalyzer() {
  const queryParams = new URLSearchParams(window.location.search);
  const contestName = queryParams.get("contest")!;
  const contestPath = `${utils.contestsPath}/${contestName}`;
  const allResultPath = `${contestPath}/allResult.csv`;
  const commitPath = `${contestPath}/commit.json`;

  const [allResultJson, setAllResultJson] = useState<AnyObject[] | undefined>();
  const [commits, setCommits] = useState<CommitObject | undefined>();
  const [modalPath, setModalPath] = useState<string | undefined>();
  const [targetColumns, setTargetColumns] = useState<string[] | undefined>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const {
    handleS3Download: downloadCommits,
    isS3Downloading: isCommitsDownloading,
    text: commitsText,
  } = useS3Download(commitPath);
  const {
    handleS3Download: downloadAllResult,
    isS3Downloading: isAllResultDownloding,
    text: allResultText,
  } = useS3Download(allResultPath);

  useEffect(() => {
    downloadCommits();
  }, []);
  useEffect(() => {
    const f = async () => {
      if (!commitsText) return;
      console.log(commitsText);
      const tmpCommits = await JSON.parse(commitsText);
      setCommits(tmpCommits);
      console.log(tmpCommits);
      setTargetColumns(Object.keys(tmpCommits));
    };
    f();
  }, [commitsText]);

  useEffect(() => {
    downloadAllResult();
  }, []);
  useEffect(() => {
    const f = async () => {
      if (!allResultText) return;
      const tmpAllResultJson = await csvToJson(allResultText!);
      setAllResultJson(tmpAllResultJson);
      console.log(tmpAllResultJson);
    };
    f();
  }, [allResultText]);

  const csvToJson = async (s: string) => {
    return csvtojson()
      .fromString(s)
      .then((jsonObj) => {
        console.log(jsonObj);
        return jsonObj as AnyObject[];
      });
  };

  if (isAllResultDownloding || isCommitsDownloading) {
    return (
      <Box sx={{ width: "100%", justifyContent: "center" }}>
        <Loader />
      </Box>
    );
  } else if (!allResultJson || !commits) {
    return <Box sx={{ width: "100%", justifyContent: "center" }}>no data</Box>;
  } else {
    return (
      <Box sx={{ width: "100%" }}>
        <BrowseModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          path={modalPath}
        />
        <BasicTable
          values={allResultJson!}
          targetColumns={targetColumns}
          columnOnClick={(col) => {
            setModalPath(commits[col]!.codePath);
            setIsModalOpen(true);
          }}
        />
      </Box>
    );
  }
}

export default ResultAnalyzer;
