import { Metadata } from "next";
import { getSessionFromCookie } from "@/utils/auth";
import { redirect } from "next/navigation";
import SignInClientPage from "./sign-in.client";
import { REDIRECT_AFTER_SIGN_IN } from "@/constants";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Access your Mulls.io Console",
  openGraph: {
    title: "Sign In - Mulls.io Console",
    description: "Access your Mulls.io Console",
    images: ["/api/og?title=Sign%20In&description=Access%20your%20Mulls.io%20Console&type=auth"],
  },
  twitter: {
    title: "Sign In - Mulls.io Console",
    description: "Access your Mulls.io Console",
    images: ["/api/og?title=Sign%20In&description=Access%20your%20Mulls.io%20Console&type=auth"],
  },
};

const SignInPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) => {
  const { redirect: redirectParam } = await searchParams;
  const session = await getSessionFromCookie();
  const redirectPath = redirectParam ?? REDIRECT_AFTER_SIGN_IN as unknown as string;

  if (session) {
    return redirect(redirectPath);
  }

  return (
    <SignInClientPage redirectPath={redirectPath} />
  )
}

export default SignInPage;
