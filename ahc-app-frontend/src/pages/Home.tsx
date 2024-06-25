import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import * as Storage from "aws-amplify/storage";
import { useEffect, useState } from "react";
import "./style.css";
import * as utils from "./utils";

function Home() {
  const [oldContest, setOldContest] = useState<string>("");
  const [newContest, setNewContest] = useState<string>("");
  const [contests, setContests] = useState<string[] | undefined>();

  const contestDataPath = utils.contestsPath + "/contestData.txt";

  const getContests = async () => {
    let text: string = "";
    try {
      text = await (
        await Storage.downloadData({ path: contestDataPath }).result
      ).body.text();
    } catch (error) {
      console.log(error);
    }
    if (text === "") {
      setContests([]);
    } else {
      setContests(text.split(","));
    }
  };
  useEffect(() => {
    getContests();
  }, []); // 空の依存配列を渡して初回マウント時にのみ実行

  const createNewContest = async () => {
    var text: string = "";
    try {
      text = await (
        await Storage.downloadData({ path: contestDataPath }).result
      ).body.text();
    } catch (error) {
      console.log(error);
    }

    const newText = text === "" ? newContest : `${text},${newContest}`;
    const blob = new Blob([newText], { type: "text/plain" });
    try {
      await Storage.uploadData({ path: contestDataPath, data: blob }).result;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="body">
      <Box
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ marginBottom: 5 }} display="flex">
          <FormControl sx={{ width: "70%" }}>
            <TextField
              value={newContest}
              label="新コンテスト名"
              onChange={(event) => setNewContest(event.target.value)}
            ></TextField>
          </FormControl>
          <Button
            sx={{ width: "30%" }}
            href={`/codeTest?contest=${newContest}`}
            disabled={newContest === "" || contests?.includes(newContest)}
            onClick={createNewContest}
          >
            移動
          </Button>
        </Box>
        <Box sx={{ minWidth: 250 }} display="flex">
          <FormControl sx={{ width: "70%" }}>
            <InputLabel>既存コンテスト名</InputLabel>
            <Select
              value={oldContest}
              label="既存コンテスト名"
              onChange={(event) => setOldContest(event.target.value)}
            >
              {contests?.map((item) => {
                return <MenuItem value={item}>{item}</MenuItem>;
              })}
            </Select>
          </FormControl>
          <Button
            sx={{ width: "30%" }}
            href={`/codeTest?contest=${oldContest}`}
            disabled={oldContest === ""}
          >
            移動
          </Button>
        </Box>
      </Box>
    </div>
  );
}

export default Home;
