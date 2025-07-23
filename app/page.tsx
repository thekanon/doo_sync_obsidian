import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the new API-based directory view instead of static _Index_of_ file
  redirect('/directory');
}
