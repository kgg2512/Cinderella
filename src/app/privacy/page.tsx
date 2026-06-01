import { redirect } from "next/navigation";

// 신데렐라 개인정보처리방침: public/privacy.html로 리다이렉트
export default function PrivacyPage() {
  redirect("/privacy.html");
}
