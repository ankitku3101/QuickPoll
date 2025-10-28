"use client";

import { useState } from "react";
import { useSignIn, useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface GuestLoginButtonProps {
  className?: string;
}

export default function GuestLoginButton({ className }: GuestLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const { signIn, isLoaded, setActive } = useSignIn();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleGuestLogin = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);

      if (user) {
        await signOut();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guest`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to create guest session");

      const { token } = await res.json();

      const result = await signIn.create({
        strategy: "ticket",
        ticket: token,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Signed in as Guest!");
        router.refresh();
        router.push("/");
      } else {
        toast.error("Guest sign-in incomplete");
      }
    } catch (err: any) {
      console.error("Guest login failed:", err);
      toast.error("Guest login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userLoaded) return null;

  return (
    <button
      onClick={handleGuestLogin}
      disabled={loading}
      className={`${className} px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-all tracking-tight cursor-pointer disabled:opacity-60`}
    >
      {loading ? "Hang On.." : "Guest User"}
    </button>
  );
}
