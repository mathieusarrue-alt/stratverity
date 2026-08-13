import {
  chatGPTSignOutPath,
  requireChatGPTUser,
} from "../chatgpt-auth";
import AccountContent from "./AccountContent";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  return <AccountContent user={user} signOutPath={chatGPTSignOutPath("/")} />;
}
