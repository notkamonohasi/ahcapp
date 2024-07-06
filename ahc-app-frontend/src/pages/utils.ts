import { Temporal } from "@js-temporal/polyfill";

export const contestsPath = "public/contests";

export function getJapanTime() {
  const japanTime =
    Temporal.Now.zonedDateTimeISO("UTC").withTimeZone("Asia/Tokyo");
  const formattedJapanTime = `${String(japanTime.month).padStart(
    2,
    "0"
  )}-${String(japanTime.day).padStart(2, "0")} ${String(
    japanTime.hour
  ).padStart(2, "0")}:${String(japanTime.minute).padStart(2, "0")}:${String(
    japanTime.second
  ).padStart(2, "0")}`;
  return formattedJapanTime;
}
