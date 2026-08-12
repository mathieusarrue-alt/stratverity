import { requireChatGPTUser } from "../chatgpt-auth";
import AdminReviewConsole from "./review-console";

export default async function AdminPage() {
  await requireChatGPTUser("/admin");
  return <AdminReviewConsole />;
}
