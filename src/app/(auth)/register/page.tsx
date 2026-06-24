import { redirect } from "next/navigation";

// Registration is disabled — accounts are created by administrators
export default function RegisterPage() {
  redirect("/login");
}
