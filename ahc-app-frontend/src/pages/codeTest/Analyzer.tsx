import { Loader } from "@aws-amplify/ui-react";
import { Box } from "@mui/material";
import * as Storage from "aws-amplify/storage";
import csvtojson from "csvtojson";
import { useEffect, useState } from "react";
import BasicTable from "../../components/BasicTable";
import "../style.css";
import { AnyObject } from "../type";
import * as utils from "../utils";

const ApiUrl = process.env.REACT_APP_API_URL!;
const ApiKey = process.env.REACT_APP_API_KEY!;

function ResultAnalyzer() {
  const queryParams = new URLSearchParams(window.location.search);
  const contestName = queryParams.get("contest")!;
  const contestPath = `${utils.contestsPath}/${contestName}`;
  const allResultPath = `${contestPath}/allResult.csv`;

  const [allResult, setAllResult] = useState<string | undefined>();
  const [allResultJson, setAllResultJson] = useState<AnyObject[] | undefined>();
  const [isAllResultDownloding, setIsAllResultDownloding] =
    useState<boolean>(false);

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
        {allResult ? <BasicTable values={allResultJson!} /> : ""}
      </Box>
    );
  }
}

export default ResultAnalyzer;
