"use server";

import { ID, Query } from "node-appwrite";
import { parseStringify } from "../utils";
import { appwriteconfig } from "../appwrite/config";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { avatarPlaceHolderUrl } from "@/constants";
import { redirect } from "next/navigation";

const getUserByEmail = async (email: string) => {
  try {
    console.log("Checking user with email:", email);
    console.log("Using database ID:", appwriteconfig.databaseId);
    console.log("Using collection ID:", appwriteconfig.UserCollectionId);

    const { databases } = await createAdminClient();

    // Log successful client creation
    console.log("Admin client created successfully");

    const result = await databases.listDocuments(
      appwriteconfig.databaseId,
      appwriteconfig.UserCollectionId,
      [Query.equal("email", [email])]
    );

    console.log("Query executed successfully, found documents:", result.total);
    return result.total > 0 ? result.documents[0] : null;
  } catch (error) {
    // Log the full error details
    console.error("Error checking user by email:", error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes("Permission denied")) {
        throw new Error("Permission denied: Check API key permissions");
      } else if (error.message.includes("Collection not found")) {
        throw new Error("Collection not found: Check collection ID");
      } else if (error.message.includes("Database not found")) {
        throw new Error("Database not found: Check database ID");
      } else {
        throw new Error(`Failed to check if user exists: ${error.message}`);
      }
    }

    throw new Error("Failed to check if user exists");
  }
};

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  // Return a more specific error message if available
  if (error instanceof Error) {
    throw new Error(`${message}: ${error.message}`);
  }
  throw new Error(message);
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    // Make sure email is properly formatted
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email format");
    }

    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    // Log the specific error for debugging
    console.error("Failed to send email OTP:", error);

    // Check for specific Appwrite errors
    if (error instanceof Error) {
      if (error.message.includes("Rate limit")) {
        throw new Error("Too many attempts. Please try again later.");
      }
      if (error.message.includes("Invalid email")) {
        throw new Error("The email address is invalid.");
      }
    }

    throw new Error("Failed to send verification email");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  try {
    // Validate inputs
    if (!fullName || fullName.trim().length < 2) {
      throw new Error(
        "Full name is required and must be at least 2 characters"
      );
    }

    if (!email || !email.includes("@")) {
      throw new Error("Valid email is required");
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Send email OTP
    const accountId = await sendEmailOTP({ email });
    if (!accountId) throw new Error("Failed to send verification email");

    // Create new user
    const { databases } = await createAdminClient();

    try {
      await databases.createDocument(
        appwriteconfig.databaseId,
        appwriteconfig.UserCollectionId,
        ID.unique(),
        {
          fullName,
          email,
          avatar: avatarPlaceHolderUrl,
          accountId,
        }
      );
    } catch (dbError) {
      console.error("Failed to create user document:", dbError);

      // More specific error handling
      if (dbError instanceof Error) {
        if (dbError.message.includes("Permission denied")) {
          throw new Error("Permission denied: Check API key permissions");
        } else if (dbError.message.includes("duplicate")) {
          throw new Error("A user with this information already exists");
        } else {
          throw new Error(
            `Failed to create user in database: ${dbError.message}`
          );
        }
      }

      throw new Error("Failed to create user in database");
    }

    return parseStringify({ accountId });
  } catch (error) {
    // Provide more specific error message
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create account");
  }
};

export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession(accountId, password);
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP");
  }
};

export const getCurrentUser = async () => {
  try {
    const { databases, account } = await createSessionClient();

    const result = await account.get();

    const user = await databases.listDocuments(
      appwriteconfig.databaseId,
      appwriteconfig.UserCollectionId,
      [Query.equal("accountId", result.$id)]
    );

    if (user.total <= 0) return null;

    return parseStringify(user.documents[0]);
  } catch (error) {
    // Optional: log error for debugging
    console.error("getCurrentUser error:", error);
    return null;
  }
};

export const signOutUser = async () => {
  try {
    const { account } = await createSessionClient();

    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    console.error("Failed to sign out user:", error);
  } finally {
    redirect("/sign-in");
  }
};

export const signInUser = async ({ email }: { email: string }) => {
  try {
    // Check if user exists in the database
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      // User exists, send OTP
      const accountId = await sendEmailOTP({ email });
      if (!accountId) throw new Error("Failed to send verification email");

      return parseStringify({ accountId });
    } else {
      // User doesn't exist
      return parseStringify({ accountId: null, error: "User not found" });
    }
  } catch (error) {
    handleError(error, "Failed to sign in user");
  }
};
