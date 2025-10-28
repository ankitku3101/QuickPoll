import express from "express";
import { Clerk } from "@clerk/clerk-sdk-node";

const router = express.Router();
const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });

router.post("/", async (req, res) => {
  try {
    const randomId = Math.random().toString(36).substring(2, 10);
    const guestEmail = `guest-${randomId}@example.com`;
    const guestUsername = `guest_${randomId}`;
    console.log("Creating guest user:", guestEmail, guestUsername);

    const user = await clerk.users.createUser({
      emailAddress: [guestEmail],
      username: guestUsername,
      skipPasswordRequirement: true,
      publicMetadata: { isGuest: true },
    });

    console.log("Guest user created:", {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      username: user.username,
    });

    const token = await clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 3600,
    });

    console.log("Sign-in token created:", token.id);

    return res.json({ token: token.token });
  } catch (err: any) {
    console.error("Guest login failed:", {
      message: err.message,
      response: err.response?.data || null,
      stack: err.stack,
    });
    res.status(500).json({
      error: "Guest login failed",
      details: err.response?.data || err.message,
    });
  }
});

export default router;