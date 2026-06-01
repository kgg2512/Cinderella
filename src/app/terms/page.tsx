import { redirect } from "next/navigation";

// 신데렐라 이용약관: public/terms.html로 리다이렉트
export default function TermsPage() {
  redirect("/terms.html");
}
