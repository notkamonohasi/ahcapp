import * as Storage from "aws-amplify/storage";
import { useState } from "react";

export function useS3Download(path: string | undefined) {
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

export function useS3Upload(path: string) {
  const [isS3Uploading, setIsS3Uploading] = useState<boolean>(false);

  const handleS3Upload = async (file: File) => {
    setIsS3Uploading(true);
    var success = true;

    try {
      const result = await Storage.uploadData({
        data: file,
        path: path,
      }).result;
      console.log(result);
    } catch (error) {
      console.log(error);
      success = false;
    }

    setIsS3Uploading(false);
    return success;
  };

  return {
    handleS3Upload,
    isS3Uploading,
  };
}
