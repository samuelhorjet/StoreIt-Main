"use server";

import { Account, Avatars, Client, Databases, Storage } from "node-appwrite";
import { cookies } from "next/headers";
import { appwriteconfig } from "./config";

export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteconfig.endpointUrl)
    .setProject(appwriteconfig.projectId);

  const session = (await cookies()).get("appwrite-session");

  if (!session || !session.value) throw new Error("No session");

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
};


export const createAdminClient = async () => {
  try {
    // Validate configuration
    if (!appwriteconfig.endpointUrl)
      throw new Error("Missing Appwrite endpoint URL");
    if (!appwriteconfig.projectId)
      throw new Error("Missing Appwrite project ID");
    if (!appwriteconfig.secretkey)
      throw new Error("Missing Appwrite secret key");

    const client = new Client()
      .setEndpoint(appwriteconfig.endpointUrl)
      .setProject(appwriteconfig.projectId)
      .setKey(appwriteconfig.secretkey);

    return {
      get account() {
        return new Account(client);
      },
      get databases() {
        return new Databases(client);
      },
      get storage() {
        return new Storage(client);
      },
      get avatars() {
        return new Avatars(client);
      },
    };
  } catch (error) {
    console.error("Failed to create Appwrite admin client:", error);
    throw new Error("Failed to initialize Appwrite client");
  }
};
