import Link from "next/link";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Revenue Engine
      </h1>
      <p className="mt-3 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        The sales pipeline CRM for your team.
      </p>
      <div className="mt-8 flex gap-4">
        <Show when="signed-out">
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign up
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-black/8 px-5 py-3 text-sm font-medium hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign in
          </Link>
        </Show>
        <Show when="signed-in">
          <Link
            href="/pipeline"
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Go to pipeline
          </Link>
        </Show>
      </div>
    </div>
  );
}
