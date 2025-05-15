"use server";

import { Models } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteconfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { getCurrentUser } from "./user.actions";

// Function to get owner by ID
export const getOwnerById = async (ownerId: string) => {
  try {
    console.log("Fetching owner with ID:", ownerId);
    console.log("Database ID:", appwriteconfig.databaseId);
    console.log("User Collection ID:", appwriteconfig.UserCollectionId);

    if (!ownerId) {
      console.error("Invalid owner ID provided");
      return null;
    }

    const { databases } = await createAdminClient();

    // Try to fetch the user document from the Users collection
    try {
      const user = await databases.getDocument(
        appwriteconfig.databaseId,
        appwriteconfig.UserCollectionId,
        ownerId
      );
      console.log("Found user:", user ? user.fullName : "No user found");
      return parseStringify(user);
    } catch (docError) {
      console.error("Error fetching user document:", docError);

      // Try listing documents to see if we can find the user by ID
      try {
        const { Query } = await import("node-appwrite");
        const users = await databases.listDocuments(
          appwriteconfig.databaseId,
          appwriteconfig.UserCollectionId,
          [Query.equal("$id", [ownerId])]
        );

        console.log(`Found ${users.total} users with ID ${ownerId}`);

        if (users.total > 0) {
          console.log("Found user via query:", users.documents[0].fullName);
          return parseStringify(users.documents[0]);
        }

        // Try to find by accountId instead
        const usersByAccountId = await databases.listDocuments(
          appwriteconfig.databaseId,
          appwriteconfig.UserCollectionId,
          [Query.equal("accountId", [ownerId])]
        );

        console.log(
          `Found ${usersByAccountId.total} users with accountId ${ownerId}`
        );

        if (usersByAccountId.total > 0) {
          console.log(
            "Found user via accountId:",
            usersByAccountId.documents[0].fullName
          );
          return parseStringify(usersByAccountId.documents[0]);
        }
      } catch (listError) {
        console.error("Error listing users:", listError);
      }

      return null;
    }
  } catch (error) {
    console.error("Error fetching owner:", error);
    return null;
  }
};

export const getOwnerNameForFile = async (file: Models.Document) => {
  console.log("DEBUG getOwnerNameForFile - File data:", {
    fileId: file.$id,
    owner: file.owner,
    ownerEmail: file.ownerEmail,
    ownerName: file.ownerName,
    users: file.users,
  });

  try {
    // CRITICAL FIX: Check if the current user is viewing a shared file
    const currentUser = await getCurrentUser();
    console.log(
      "DEBUG getOwnerNameForFile - Current user:",
      currentUser?.email
    );

    // If this is a shared file (current user's email is in users array but not the owner)
    const isSharedFile =
      currentUser &&
      file.users?.includes(currentUser.email) &&
      file.ownerEmail !== currentUser.email;

    console.log("DEBUG getOwnerNameForFile - Is shared file:", isSharedFile);

    // First check if we have ownerEmail field which is more reliable
    if (file.ownerEmail) {
      try {
        // Try to find user by email which is more reliable than ID
        const { databases } = await createAdminClient();
        const { Query } = await import("node-appwrite");

        const users = await databases.listDocuments(
          appwriteconfig.databaseId,
          appwriteconfig.UserCollectionId,
          [Query.equal("email", [file.ownerEmail])]
        );

        console.log(
          `DEBUG getOwnerNameForFile - Found ${users.total} users with email ${file.ownerEmail}`
        );

        if (users.total > 0) {
          const ownerName = users.documents[0].fullName;
          console.log(
            "DEBUG getOwnerNameForFile - Found owner by email:",
            ownerName
          );
          return { ownerName };
        }
      } catch (error) {
        console.error("Error finding owner by email:", error);
      }
    }

    // If we have an owner ID as string, try to get the owner data
    if (typeof file.owner === "string" && file.owner) {
      try {
        const ownerData = await getOwnerById(file.owner);
        if (ownerData && ownerData.fullName) {
          console.log(
            "DEBUG getOwnerNameForFile - Found owner by ID:",
            ownerData.fullName
          );
          return { ownerName: ownerData.fullName };
        }
      } catch (error) {
        console.error("Error finding owner by ID:", error);
      }
    }
    // If owner is an object with fullName
    else if (typeof file.owner === "object" && file.owner?.fullName) {
      console.log(
        "DEBUG getOwnerNameForFile - Using owner object fullName:",
        file.owner.fullName
      );
      return { ownerName: file.owner.fullName };
    }
    // Use cached owner name if available
    else if (file.ownerName) {
      console.log(
        "DEBUG getOwnerNameForFile - Using cached owner name:",
        file.ownerName
      );
      return { ownerName: file.ownerName };
    }

    // IMPORTANT: For shared files, we should never show "You" as the owner
    if (isSharedFile) {
      // Use the email prefix as a last resort for shared files
      const ownerName = file.ownerEmail
        ? `${file.ownerEmail.split("@")[0]}`
        : "Unknown";
      console.log(
        "DEBUG getOwnerNameForFile - Using email prefix for shared file:",
        ownerName
      );
      return { ownerName };
    }

    // Fallback: check if current user is the owner (only for files they actually own)
    if (currentUser && currentUser.email === file.ownerEmail) {
      console.log(
        "DEBUG getOwnerNameForFile - Current user is the owner, showing 'You'"
      );
      return { ownerName: "You" };
    } else {
      // If we got here, we couldn't determine the owner
      const ownerName = file.ownerEmail
        ? `${file.ownerEmail.split("@")[0]}`
        : "Unknown";
      console.log("DEBUG getOwnerNameForFile - Using fallback:", ownerName);
      return { ownerName };
    }
  } catch (error) {
    console.error("Error in getOwnerNameForFile:", error);
    return { ownerName: "Unknown" };
  }
};
