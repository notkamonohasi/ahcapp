import * as Storage from "aws-amplify/storage";
import { useState } from "react";

export function useS3Downloader(path: string | undefined) {
  const [isS3Downloading, setIsS3Downloading] = useState<boolean>(false);
  const [text, setText] = useState<string | undefined>();
  const [blob, setBlob] = useState<Blob | undefined>();

  const handleS3Download = async () => {
    setIsS3Downloading(true);
    var success = true;

    try {
      if (!path) {
        setText(undefined);
        setBlob(undefined);
        return false;
      }

      const { body, eTag } = await Storage.downloadData({
        path: path,
      }).result;
      const tmpText = await body.text();
      setText(tmpText);
      setBlob(await body.blob());
      console.log(tmpText);
    } catch (error) {
      console.log(error);
      success = false;
    }

    setIsS3Downloading(false);
    return success;
  };

  return {
    handleS3Download,
    isS3Downloading,
    text,
    blob,
  };
}
