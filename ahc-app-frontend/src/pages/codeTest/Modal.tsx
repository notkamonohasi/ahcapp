import { Box, Button, Modal, Typography } from "@mui/material";
import * as Storage from "aws-amplify/storage";
import React from "react";
import { Commit } from "./type";

const AnalyzerModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (a: boolean) => void;
  commit: Commit;
}> = ({ isOpen, setIsOpen, commit }) => {
  const handleDownloadCode = async () => {
    try {
      const { body, eTag } = await Storage.downloadData({
        path: commit.codePath,
      }).result;
      const url = URL.createObjectURL(await body.blob());
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", commit.time);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.log(error);
    }
  };

  if (!isOpen) return null;
  return (
    <Modal
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      aria-labelledby="child-modal-title"
      aria-describedby="child-modal-description"
      sx={{
        display: "flex",
        p: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 400,
          bgcolor: "background.paper",
          border: "2px solid #000",
          boxShadow: (theme) => theme.shadows[5],
          p: 4,
        }}
      >
        <Typography variant="h6" component="h2">
          {commit.time}
        </Typography>
        <Typography sx={{ pt: 2 }}>{commit.message}</Typography>
        <Button onClick={handleDownloadCode}>download code</Button>
      </Box>
    </Modal>
  );
};

export default AnalyzerModal;
