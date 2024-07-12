import * as Storage from "aws-amplify/storage";
import { useState } from "react";

export function useS3Download(
  path: string | undefined,
  toJson: boolean = false
) {
  const [isS3Downloading, setIsS3Downloading] = useState<boolean>(false);
  const [text, setText] = useState<string | undefined>();
  const [blob, setBlob] = useState<Blob | undefined>();
  const [json, setJson] = useState<any>();

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
      if (toJson === true) setJson(await JSON.parse(tmpText));
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
    json,
  };
}

export function useS3Upload(path: string, maxFileSize: number | undefined) {
  const [isS3Uploading, setIsS3Uploading] = useState<boolean>(false);
  const [isS3Uploaded, setIsS3Uploaded] = useState<boolean>(false);
  const [file, setFile] = useState<File | undefined>();

  const handleS3Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files![0];

    if (maxFileSize && maxFileSize * 1024 * 1024 < file.size) {
      throw new Error(`uploadするファイルが${maxFileSize}MBを超えています`);
    }

    setIsS3Uploading(true);
    var success = true;

    try {
      const result = await Storage.uploadData({
        data: file,
        path: path,
      }).result;
      console.log(result);
      setFile(file);
      setIsS3Uploaded(true);
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
    isS3Uploaded,
    file,
  };
}

export function useS3DirUpload(
  path: string,
  maxDirSize: number | undefined,
  maxFileNum: number | undefined
) {
  const [isS3Uploading, setIsS3Uploading] = useState<boolean>(false);
  const [isS3Uploaded, setIsS3Uploaded] = useState<boolean>(false);
  const [files, setFiles] = useState<FileList | undefined>();

  const handleS3Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files!;

    if (maxFileNum && maxFileNum < files.length) {
      throw new Error(`uploadするファイルの数が${maxFileNum}個を超えています`);
    }

    var fileSizeSum = 0;
    for (let i = 0; i < files.length; i++) {
      fileSizeSum += files[i].size;
    }

    if (maxDirSize && maxDirSize * 1024 * 1024 < fileSizeSum) {
      throw new Error(
        `uploadするディレクトリのサイズが${maxDirSize}MBを超えています`
      );
    }

    setIsS3Uploading(true);
    var success = true;

    const f = async () => {
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = `${path}/${file.name.split("/").at(-1)!}`;
          Storage.uploadData({ path: filePath, data: file });
          console.log(filePath);
        }
      } catch (error) {
        console.log(error);
        success = false;
      }
    };
    await f();

    setIsS3Uploading(false);
    if (success) {
      setIsS3Uploaded(true);
      setFiles(files!);
    }

    return success;
  };

  return {
    handleS3Upload,
    isS3Uploading,
    isS3Uploaded,
    files,
  };
}

export function useS3Check(path: string) {
  const [isS3Checking, setIsS3Checking] = useState<boolean>(false);
  const [isS3Uploaded, setIsS3Uploaded] = useState<boolean>(false);

  const handleS3Check = async () => {
    setIsS3Checking(true);

    try {
      const result = await Storage.getProperties({
        path: path,
      });
      console.log(result);
      setIsS3Uploaded(true);
    } catch (error) {
      console.log(error);
      setIsS3Uploaded(false);
    }

    setIsS3Checking(false);
  };

  return {
    handleS3Check,
    isS3Checking,
    isS3Uploaded,
  };
}
