import ReadingProgress from "../../components/ReadingProgress";
import DSOForecastingClientPage from "./DSOForecastingClientPage";

export const metadata = {
  title: "Finance Collections & DSO Forecasting | predicta.dev",
  description:
    "Case study: time series forecasting for collections and Days Sales Outstanding (DSO) to support FP&A and treasury planning.",
  alternates: {
    canonical: "/projects/dso-forecasting",
  },
};

export default function DSOForecastingPage() {
  return (
    <>
      <ReadingProgress />
      <DSOForecastingClientPage />
    </>
  );
}
