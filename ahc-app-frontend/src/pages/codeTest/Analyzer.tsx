import { Loader } from "@aws-amplify/ui-react";
import { Box } from "@mui/material";
import * as Storage from "aws-amplify/storage";
import csvtojson from "csvtojson";
import { useEffect, useState } from "react";
import BasicTable from "../../components/BasicTable";
import "../style.css";
import { AnyObject } from "../type";
import * as utils from "../utils";
import AnalyzerModal from "./Modal";
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

  const [allResult, setAllResult] = useState<string | undefined>();
  const [allResultJson, setAllResultJson] = useState<AnyObject[] | undefined>();
  const [isAllResultDownloding, setIsAllResultDownloding] =
    useState<boolean>(false);
  const [commits, setCommits] = useState<CommitObject | undefined>();
  const [commit, setCommit] = useState<Commit | undefined>();
  const [targetColumns, setTargetColumns] = useState<string[] | undefined>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const downloadCommit = async () => {
    var tmpCommits: CommitObject | undefined;
    try {
      const { body, eTag } = await Storage.downloadData({
        path: commitPath,
      }).result;
      console.log(await body.text());
      tmpCommits = await JSON.parse(await body.text());
      console.log(tmpCommits);
    } catch (error) {
      console.log(error);
    }

    setCommits(tmpCommits);
    console.log(Object.keys(tmpCommits!));
    setTargetColumns(Object.keys(tmpCommits!));
    console.log(targetColumns);
  };
  useEffect(() => {
    downloadCommit();
  }, []);

  const downloadAllResult = async () => {
    setIsAllResultDownloding(true);
    try {
      const { body, eTag } = await Storage.downloadData({ path: allResultPath })
        .result;
      const csv = await body.text();
      console.log(csv);
      setAllResult(csv);
      const json = await csv_to_json(csv!);
      setAllResultJson(json);
    } catch (e) {
      console.log(e);
    }

    setIsAllResultDownloding(false);
  };
  useEffect(() => {
    downloadAllResult();
  }, []);

  const csv_to_json = async (s: string) => {
    return csvtojson()
      .fromString(s)
      .then((jsonObj) => {
        console.log(jsonObj);
        return jsonObj as AnyObject[];
      });
  };

  if (isAllResultDownloding) {
    return (
      <Box sx={{ width: "100%", justifyContent: "center" }}>
        <Loader />
      </Box>
    );
  } else {
    return (
      <Box sx={{ width: "100%" }}>
        <AnalyzerModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          commit={commit!}
        />
        {allResult ? (
          <BasicTable
            values={allResultJson!}
            targetColumns={targetColumns}
            columnOnClick={(col) => {
              setCommit(commits![col]!);
              setIsModalOpen(true);
            }}
          />
        ) : (
          ""
        )}
      </Box>
    );
  }
}

export default ResultAnalyzer;
