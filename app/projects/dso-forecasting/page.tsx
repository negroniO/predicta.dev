import type { Metadata } from "next";
import DSOForecastingClientPage from "./DSOForecastingClientPage";

export const metadata: Metadata = {
  title: "Collections & DSO Forecasting | Project Case Study",
  description:
    "Time series forecasting of collections and Days Sales Outstanding (DSO) to support FP&A and treasury planning.",
};

export default function DSOForecastingPage() {
  return <DSOForecastingClientPage />;
}