import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect } from "react";
import Loader from "react-spinners/BeatLoader";
import { useS3Downloader } from "../../components/S3downloader";

const BrowseModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (a: boolean) => void;
  path: string | undefined;
}> = ({ isOpen, setIsOpen, path }) => {
  const { handleS3Download, text, isS3Downloading } = useS3Downloader(path);

  useEffect(() => {
    handleS3Download();
  }, [isOpen]);

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
      {isS3Downloading ? (
        <Loader />
      ) : (
        <Box
          sx={{
            position: "relative",
            bgcolor: "background.paper",
            border: "2px solid #000",
            maxWidth: "1200px",
            boxShadow: (theme) => theme.shadows[5],
            p: 4,
          }}
        >
          <Typography variant="h6">{path!.split("/").at(-1)}</Typography>
          <pre>{text}</pre>
        </Box>
      )}
    </Modal>
  );
};

export default BrowseModal;
