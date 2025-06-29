import { redirect } from "next/navigation";
const ROOT_DIR = process.env.OBSIDIAN_ROOT_DIR || 'Root';
export default function Home() {
  redirect(`/_Index_of_${ROOT_DIR}.md`);
}
