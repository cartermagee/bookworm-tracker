import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/auth/server";

export default async function Home() {
  try {
    const r = await serverApiFetch("/api/auth/me");
    if (r.ok) {
      redirect("/library");
    }
  } catch {
    // network error — fall through to login
  }
  redirect("/login");
}
