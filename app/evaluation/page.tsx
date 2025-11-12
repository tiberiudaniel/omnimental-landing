import { redirect } from "next/navigation";

export default function EvaluationPage() {
  // Server redirect to the new “Antrenament” hub
  redirect("/antrenament");
}
