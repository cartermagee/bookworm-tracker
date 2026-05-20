// Root page redirects to /library when authed, /login otherwise.
// Phase 1 stub: always sends to /login. Phase 2 wires server-side auth check.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
