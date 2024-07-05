import { faChartLine, faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import CodeTestExecutor from "./Executor";

const CodeTest = () => <CodeTestExecutor />;
const ResultAnalyzer = () => <Typography>プルリクエストコンテンツ</Typography>;

function CodeTestHome() {
  const [selectedTab, setSelectedTab] = useState("CodeTest");

  const renderContent = () => {
    switch (selectedTab) {
      case "CodeTest":
        return <CodeTest />;
      case "ResultAnalyzer":
        return <ResultAnalyzer />;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          borderBottom: 1,
          borderColor: "divider",
          marginBottom: 2,
        }}
      >
        <Button
          onClick={() => setSelectedTab("CodeTest")}
          sx={{
            flex: 1,
            backgroundColor:
              selectedTab === "CodeTest" ? "lightgray" : undefined,
          }}
        >
          <FontAwesomeIcon icon={faGear} />
          &thinsp; CodeTest
        </Button>
        <Button
          onClick={() => setSelectedTab("ResultAnalyzer")}
          sx={{
            flex: 1,
            backgroundColor:
              selectedTab === "ResultAnalyzer" ? "lightgray" : undefined,
          }}
        >
          <FontAwesomeIcon icon={faChartLine} />
          &thinsp; Analyzer
        </Button>
      </Box>
      <Box sx={{ padding: 2 }}>{renderContent()}</Box>
    </Box>
  );
}

export default CodeTestHome;
