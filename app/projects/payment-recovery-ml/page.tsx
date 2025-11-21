import type { Metadata } from "next";
import PaymentRecoveryClientPage from "./PaymentRecoveryClientPage";

export const metadata: Metadata = {
  title: "Payment Recovery ML | Project Case Study",
  description:
    "End-to-end machine learning system to predict recovered payments and prioritise collections outreach by expected revenue.",
};

export default function PaymentRecoveryPage() {
  return <PaymentRecoveryClientPage />;
}