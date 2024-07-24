import axios from "axios";

const ApiUrl = process.env.REACT_APP_API_URL!;
const ApiKey = process.env.REACT_APP_API_KEY!;

type Params = {
  [key: string]: any;
};

/**
 * 署名 + lambda関数URL(GET) を一括で行う
 */
export async function presignLambdaGet(methodName: string, params: Params) {
  const presignUrl = `${ApiUrl}/Presign`;
  var presignResponse;
  try {
    presignResponse = await axios.get(presignUrl, {
      headers: { "x-api-key": ApiKey },
      params: { methodName, ...params },
    });
    console.log(presignResponse);
  } catch (error) {
    console.log(error);
    return { success: false };
  }

  const presignedUrl = presignResponse.data!.presignedUrl as string;
  try {
    const lambdaResponse = await axios.get(presignedUrl);
    const result = lambdaResponse.data;
    console.log(result);
    return { success: true, result: result };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
}
