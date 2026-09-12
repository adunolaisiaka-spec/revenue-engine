import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          Revenue Engine
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center py-16">
        <SignUp />
      </div>
    </div>
  );
}
