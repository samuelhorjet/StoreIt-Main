"use server";

import { ID, type Models, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { getCurrentUser } from "./user.actions";
import { appwriteconfig } from "@/lib/appwrite/config";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "../appwrite";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  if (error instanceof Error) {
    throw new Error(`${message}: ${error.message}`);
  }
  throw new Error(message);
};

interface UploadFileProps {
  file: File;
  ownerId: string;
  accountId: string;
  path: string;
}

export const uploadFiles = async ({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) => {
  const { storage, databases } = await createAdminClient();
  console.log("[Upload Start] File:", file.name);

  try {
    let resolvedOwnerId = ownerId;

    if (
      !resolvedOwnerId ||
      typeof resolvedOwnerId !== "string" ||
      resolvedOwnerId === "undefined" ||
      resolvedOwnerId === "null"
    ) {
      console.log("[Owner Check] Fetching current user...");
      const currentUser = await getCurrentUser();
      if (currentUser) {
        resolvedOwnerId = currentUser.$id;
        console.log("[Owner Resolved] Using current user:", resolvedOwnerId);
      } else {
        throw new Error("Invalid owner ID and no current user found.");
      }
    }

    // Convert file to buffer
    let buffer;
    try {
      console.log("[Buffer Conversion] Reading file buffer...");
      buffer = Buffer.from(await file.arrayBuffer());
      console.log("[Buffer Conversion] Success. Size:", buffer.length);
    } catch (bufferErr: unknown) {
      console.error("[Buffer Error] Failed to read file buffer:", bufferErr);
      throw new Error(
        "Unable to read file buffer. Possibly too large or unsupported."
      );
    }

    // Upload to storage
    let bucketFile;
    try {
      console.log("[Storage Upload] Uploading to Appwrite bucket...");
      bucketFile = await storage.createFile(
        appwriteconfig.bucketId,
        ID.unique(),
        InputFile.fromBuffer(buffer, file.name)
      );
      console.log("[Storage Upload] Success:", bucketFile);
    } catch (storageErr: unknown) {
      console.error(
        "[Storage Upload Error] Appwrite failed to store file:",
        storageErr
      );
      if (storageErr instanceof Error) {
        console.log("Detailed Storage Error:", storageErr.message);
      }
      throw new Error("Failed to upload file to storage.");
    }

    const { type, extension } = getFileType(bucketFile.name);

    let currentUser;
    try {
      console.log("[User Email Fetch] Getting current user again...");
      currentUser = await getCurrentUser();
    } catch (userErr: unknown) {
      console.warn("[User Email Fetch] Failed to get current user:", userErr);
      if (userErr instanceof Error) {
        console.log("Detailed User Fetch Error:", userErr.message);
      }
    }

    const userEmail = currentUser?.email || "";
    const userName = currentUser?.fullName || "";

    // Create file document with all required fields according to schema
    const fileDocument = {
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      type,
      bucketField: bucketFile.$id,
      accountId,
      owner: resolvedOwnerId,
      ownerEmail: userEmail,
      ownerName: userName, // Add the owner's name
      extension,
      size: bucketFile.sizeOriginal,
      users: userEmail ? [userEmail] : [],
      allowReshare: true,
    };

    console.log("[DB Save] File document to create:", fileDocument);

    const documentId = ID.unique();

    let newFile;
    try {
      console.log("[DB Save] Creating file document...");
      newFile = await databases.createDocument(
        appwriteconfig.databaseId,
        appwriteconfig.filesCollectionId,
        documentId,
        fileDocument
      );
      console.log("[DB Save] Document created:", newFile.$id);
    } catch (dbErr: unknown) {
      console.error("[DB Save Error] Failed to save file document:", dbErr);
      if (dbErr instanceof Error) {
        console.log("Detailed DB Error:", dbErr.message);
      }
      // Try to get more specific error information
      try {
        // Check if the collection exists
        await databases.getCollection(
          appwriteconfig.databaseId,
          appwriteconfig.filesCollectionId
        );
        console.log("[DB Check] Collection exists");

        // Try to create a minimal document to see if it works
        const minimalDoc = {
          name: bucketFile.name,
          url: constructFileUrl(bucketFile.$id),
          type,
          bucketField: bucketFile.$id,
          accountId,
          ownerEmail: userEmail,
        };
        console.log("[DB Retry] Trying with minimal document:", minimalDoc);

        await databases.createDocument(
          appwriteconfig.databaseId,
          appwriteconfig.filesCollectionId,
          ID.unique(),
          minimalDoc
        );
        console.log("[DB Retry] Minimal document created successfully");
      } catch (checkErr) {
        console.error("[DB Check Error] Additional error info:", checkErr);
      }

      throw new Error("Failed to save file record.");
    }

    try {
      console.log("[Document Verification] Checking saved document...");
      const verifyDoc = await databases.getDocument(
        appwriteconfig.databaseId,
        appwriteconfig.filesCollectionId,
        newFile.$id
      );

      if (!verifyDoc.owner || verifyDoc.owner !== resolvedOwnerId) {
        console.log("[Document Verification] Updating missing owner...");
        await databases.updateDocument(
          appwriteconfig.databaseId,
          appwriteconfig.filesCollectionId,
          newFile.$id,
          {
            owner: resolvedOwnerId,
            ownerEmail: userEmail,
            ownerName: userName,
          }
        );
      }
    } catch (verifyError: unknown) {
      console.error("[Document Verification Error]:", verifyError);
      if (verifyError instanceof Error) {
        console.log("Detailed Verification Error:", verifyError.message);
      }
    }

    console.log("[Upload Completed] Revalidating path:", path);
    revalidatePath(path);

    return parseStringify(newFile);
  } catch (error: unknown) {
    console.error("[Upload Error Caught]:", error);
    if (error instanceof Error) {
      console.log("Error details:", error.message);
    }

    // Optional: if handleError doesn't throw, log manually
    handleError(error, "Failed to upload file");

    // Still throw to let frontend catch
    throw error;
  }
};

export const fixAllFiles = async (): Promise<
  { updated: number } | undefined
> => {
  const { databases } = await createAdminClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) throw new Error("User not found");

  try {
    console.log("Fixing all files in the collection");

    const files = await databases.listDocuments(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      []
    );

    console.log(`Found ${files.total} total files in collection`);

    let updatedCount = 0;

    for (const file of files.documents) {
      try {
        await databases.updateDocument(
          appwriteconfig.databaseId,
          appwriteconfig.filesCollectionId,
          file.$id,
          {
            owner: currentUser.$id,
            ownerEmail: currentUser.email,
            users: [currentUser.email],
            allowReshare:
              file.allowReshare !== undefined ? file.allowReshare : true,
          }
        );

        updatedCount++;
      } catch (fileError) {
        console.error(`Error updating file ${file.$id}:`, fileError);
      }
    }

    return { updated: updatedCount };
  } catch (error) {
    console.error("Error fixing files:", error);
    handleError(error, "Failed to fix files");
    return { updated: 0 };
  }
};

const createQueries = (
  CurrentUser: Models.Document,
  types: string[],
  searchText: string,
  sort: string,
  limit?: number
) => {
  const queries = [
    Query.or([
      Query.equal("owner", [CurrentUser.$id]),
      Query.contains("users", [CurrentUser.email]),
    ]),
  ];

  if (types.length > 0) {
    queries.push(Query.equal("type", types));
  }
  if (searchText) {
    queries.push(Query.contains("name", searchText));
  }
  if (limit) {
    queries.push(Query.limit(limit));
  }
  if (sort) {
    const [sortBy, orderBy] = sort.split("-");
    queries.push(
      orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy)
    );
  }
  return queries;
};

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
}: GetFilesProps) => {
  const { databases } = await createAdminClient();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { documents: [], total: 0 };
    }

    const queries = createQueries(currentUser, types, searchText, sort, limit);

    const files = await databases.listDocuments(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      queries
    );

    return parseStringify(files);
  } catch (error) {
    console.error("Error getting files:", error);
    handleError(error, "Failed to get files");
  }
};

type RenameFileProps = {
  fileId: string;
  name: string;
  extension: string;
  path: string;
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  const { databases } = await createAdminClient();

  try {
    // First get the file to check if it has ownerEmail
    const fileDoc = await databases.getDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId
    );

    const newName = `${name}.${extension}`;
    const updateData: Record<string, any> = { name: newName };

    // If ownerEmail is missing, add it
    if (!fileDoc.ownerEmail) {
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.email) {
        updateData.ownerEmail = currentUser.email;
      }
    }

    const uploadFile = await databases.updateDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId,
      updateData
    );

    revalidatePath(path);
    return uploadFile;
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

type UpdateFileUsersProps = {
  fileId: string;
  emails: string[];
  path: string;
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  const { databases } = await createAdminClient();

  try {
    const currentFile = await databases.getDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId
    );

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.email) {
      throw new Error("Current user not found");
    }

    // Check if current user is allowed to share this file
    const isOwner = currentFile.ownerEmail === currentUser.email;
    if (!isOwner && currentFile.allowReshare === false) {
      throw new Error("You don't have permission to share this file");
    }

    // Get existing users and add new ones without removing existing ones
    const existingUsers = currentFile.users || [];
    const ownerEmail = currentFile.ownerEmail || currentUser.email;

    // Create a Set to remove duplicates
    const uniqueUsers = new Set([...existingUsers, ...emails, ownerEmail]);
    const updatedUsers = Array.from(uniqueUsers);

    const result = await databases.updateDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId,
      {
        users: updatedUsers,
        // Make sure these fields are preserved and not overwritten
        // This ensures owner information is maintained when sharing
        $ownerName: currentFile.$ownerName || undefined,
        owner: currentFile.owner || undefined,
        ownerEmail: currentFile.ownerEmail || undefined,
      }
    );

    revalidatePath(path);
    return parseStringify(result);
  } catch (error) {
    handleError(error, "Failed to share file");
  }
};

// Update the allowReshare setting for a file
export const updateAllowReshare = async ({
  fileId,
  allowReshare,
  path,
}: {
  fileId: string;
  allowReshare: boolean;
  path: string;
}) => {
  const { databases } = await createAdminClient();

  try {
    const currentFile = await databases.getDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId
    );

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.email) {
      throw new Error("Current user not found");
    }

    // Only the owner can change this setting
    if (currentFile.ownerEmail !== currentUser.email) {
      throw new Error("Only the file owner can change sharing permissions");
    }

    const result = await databases.updateDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId,
      {
        allowReshare,
      }
    );

    revalidatePath(path);
    return parseStringify(result);
  } catch (error) {
    handleError(error, "Failed to update sharing permissions");
  }
};

type DeleteFileProps = {
  fileId: string;
  bucketFileId: string;
  path: string;
};

export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: DeleteFileProps) => {
  const { databases, storage } = await createAdminClient();

  try {
    // First get the file to check permissions
    const fileDoc = await databases.getDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId
    );

    // Delete the file document from the database
    const deletedFile = await databases.deleteDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId
    );

    if (deletedFile) {
      // Delete the actual file from storage
      await storage.deleteFile(appwriteconfig.bucketId, bucketFileId);
    }

    revalidatePath(path);
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to delete file");
  }
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  const { databases } = await createAdminClient();

  try {
    const users = await databases.listDocuments(
      appwriteconfig.databaseId,
      appwriteconfig.UserCollectionId,
      [Query.equal("email", [email])]
    );

    return users.total > 0;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
};

export const removeUserFromFile = async ({
  fileId,
  emailToRemove,
  path,
}: {
  fileId: string;
  emailToRemove: string;
  path: string;
}) => {
  const { databases } = await createAdminClient();

  try {
    const currentFile = await databases.getDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId
    );

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.email) {
      throw new Error("Current user not found");
    }

    // If emailToRemove is empty, this is a delete operation
    if (!emailToRemove) {
      // Delete the file completely
      return await deleteFile({
        fileId,
        bucketFileId: currentFile.bucketField,
        path,
      });
    }

    // For removing a user from shared list
    const isOwner =
      currentFile.owner === currentUser.$id ||
      currentFile.ownerEmail === currentUser.email;

    if (!isOwner) {
      throw new Error(
        "You don't have permission to remove users from this file"
      );
    }

    if (emailToRemove === currentFile.ownerEmail) {
      throw new Error("Cannot remove the file owner");
    }

    const updatedUsers = currentFile.users.filter(
      (email: string) => email !== emailToRemove
    );

    const result = await databases.updateDocument(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      fileId,
      {
        users: updatedUsers,
      }
    );

    revalidatePath(path);
    return parseStringify(result);
  } catch (error) {
    handleError(error, "Failed to remove user from file");
  }
};

export async function getTotalSpaceUsed(timestamp?: number) {
  try {
    // Force cache busting with the timestamp
    console.log("Getting total space used at:", timestamp || Date.now());

    const { databases } = await createAdminClient(); // Use admin client for better access
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    // Add cache-busting query parameter
    const files = await databases.listDocuments(
      appwriteconfig.databaseId,
      appwriteconfig.filesCollectionId,
      [
        Query.or([
          Query.equal("owner", [currentUser.$id]),
          Query.contains("users", [currentUser.email]),
        ]),
        Query.limit(1000), // 👈 Ensure we fetch up to 1000 files
        Query.orderDesc("$updatedAt"), // Ensure we get the latest updates
      ]
    );

    const totalSpace = {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024 * 1024, // 2GB
    };

    files.documents.forEach((file) => {
      // Normalize the file type to lowercase and ensure it's a valid type
      const fileTypeRaw = (file.type || "").toLowerCase();
      const fileType = ["image", "document", "video", "audio"].includes(
        fileTypeRaw
      )
        ? (fileTypeRaw as FileType)
        : "other";

      // Ensure we have a valid size (convert to number if it's a string)
      const fileSize =
        typeof file.size === "string"
          ? Number.parseInt(file.size, 10)
          : Number(file.size) || 0;

      // Add to the appropriate category
      totalSpace[fileType].size += fileSize;
      totalSpace.used += fileSize;

      // Update latest date for this file type
      const fileDate = file.$updatedAt || file.$createdAt;
      if (
        fileDate &&
        (!totalSpace[fileType].latestDate ||
          new Date(fileDate) > new Date(totalSpace[fileType].latestDate))
      ) {
        totalSpace[fileType].latestDate = fileDate;
      }
    });

    return parseStringify(totalSpace);
  } catch (error) {
    console.error("Error calculating total space used:", error);
    handleError(error, "Error calculating total space used: ");

    // Return default structure with zeros to prevent UI errors
    return {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024 * 1024, // 2GB
    };
  }
}
