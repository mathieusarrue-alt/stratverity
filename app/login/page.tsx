import {
  chatGPTSignInPath,
  getChatGPTUser,
} from "../chatgpt-auth";
import LoginContent from "./LoginContent";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ return_to?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawReturnTo = Array.isArray(params.return_to)
    ? params.return_to[0]
    : params.return_to;
  const returnTo = rawReturnTo ?? "/account";
  const user = await getChatGPTUser();
  const destination = user ? returnTo : chatGPTSignInPath(returnTo);

  return <LoginContent user={user} destination={destination} />;
}
