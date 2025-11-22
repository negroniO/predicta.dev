import ReadingProgress from "../../components/ReadingProgress";
import PaymentRecoveryClientPage from "./PaymentRecoveryClientPage";

export const metadata = {
  title: "Payment Recovery ML | predicta.dev",
  description:
    "Case study: ML system to predict recovery of failed / unpaid transactions and prioritise credit control outreach by expected recovered revenue.",
  alternates: {
    canonical: "/projects/payment-recovery-ml",
  },
};

export default function PaymentRecoveryPage() {
  return (
    <>
      <ReadingProgress />
      <PaymentRecoveryClientPage />
    </>
  );
}
