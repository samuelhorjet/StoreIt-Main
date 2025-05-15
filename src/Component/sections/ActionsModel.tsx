"use client";

import type React from "react";

import type { Models } from "node-appwrite";
import { useEffect, useState } from "react";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getOwnerById } from "@/lib/actions/owner.actions";
import Image from "next/image";
import { updateAllowReshare } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { getOwnerNameForFile } from "@/lib/actions/owner.actions";

// Moved state to parent component
const ImageThumbnail = ({ file }: { file: Models.Document }) => {
  return (
    <div className="file-details-thumbnail">
      <Thumbnail type={file.type} extension={file.extension} url={file.url} />
      <div className="flex flex-col">
        <p className="subtitle-2 mb-1">{file.name}</p>
        <FormattedDateTime date={file.$createdAt} className="caption" />
      </div>
    </div>
  );
};

const DetailsRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex w-full">
      <p className="file-details-label text-left">{label}</p>
      <p className="file-details-label text-left truncate ml-2 flex-1">
        {value}
      </p>
    </div>
  );
};

export const FileDetails = ({ file }: { file: Models.Document }) => {
  const [ownerName, setOwnerName] = useState<string>("Loading...");

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        // Use the getOwnerNameForFile function to get the correct owner name
        const ownerData = await getOwnerNameForFile(file);
        setOwnerName(ownerData.ownerName);
      } catch (error) {
        console.error("Error fetching owner name:", error);

        // Fallback to the original logic if the new function fails
        if (file.owner === null) {
          try {
            const currentUser = await getCurrentUser();
            setOwnerName(currentUser?.fullName || "You");
          } catch {
            setOwnerName("You");
          }
          return;
        }

        if (typeof file.owner === "string" && file.owner) {
          try {
            const ownerData = await getOwnerById(file.owner);
            setOwnerName(ownerData?.fullName || "Unknown");
          } catch {
            setOwnerName("Unknown");
          }
        } else if (typeof file.owner === "object" && file.owner?.fullName) {
          setOwnerName(file.owner.fullName);
        } else if (file.ownerName) {
          setOwnerName(file.ownerName);
        } else if (file.ownerEmail) {
          setOwnerName(file.ownerEmail.split("@")[0]);
        } else {
          setOwnerName("Unknown");
        }
      }
    };

    fetchOwner();
  }, [file]);

  return (
    <>
      <ImageThumbnail file={file} />
      <div className="space-y-4 px-2 pt-2">
        <DetailsRow label="Format:" value={file.extension} />
        <DetailsRow label="Size:" value={convertFileSize(file.size)} />
        <DetailsRow label="Owner:" value={ownerName} />
        <DetailsRow
          label="Last edit:"
          value={formatDateTime(file.$updatedAt)}
        />
      </div>
    </>
  );
};

interface ShareInputProps {
  file: Models.Document;
  onInputChange: (emails: string[]) => void;
  onRemove: (email: string) => void;
  onAllowReshareChange?: (allow: boolean) => void;
}

// Update the ShareInput component to properly show the remove button for the owner
export const ShareInput = ({
  file,
  onInputChange,
  onRemove,
  onAllowReshareChange,
}: ShareInputProps) => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [allowReshare, setAllowReshare] = useState<boolean>(
    file.allowReshare !== false
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [ownerName, setOwnerName] = useState<string>("Loading...");
  const path = usePathname();

  // Get current user email on component mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserEmail(user.email || "");

          // Check if current user is the owner
          const isOwner =
            file.owner === user.$id || file.ownerEmail === user.email;
          setIsOwner(isOwner);
        }

        // Get the correct owner name
        const ownerData = await getOwnerNameForFile(file);
        setOwnerName(ownerData.ownerName);
      } catch (error) {
        console.error("Error getting current user or owner name:", error);
      }
    };

    getUser();
  }, [file]);

  // Handle allow reshare toggle
  const handleAllowReshareChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.checked;
    setAllowReshare(newValue);

    if (onAllowReshareChange) {
      onAllowReshareChange(newValue);
    }

    if (isOwner) {
      setIsUpdating(true);
      try {
        await updateAllowReshare({
          fileId: file.$id,
          allowReshare: newValue,
          path,
        });
      } catch (error) {
        console.error("Error updating reshare permission:", error);
        // Revert the UI state if the update fails
        setAllowReshare(!newValue);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Filter out users for display
  // If user is owner, show all shared users except themselves
  // If user is not owner, don't show any remove buttons
  const sharedUsers = file.users.filter((email: string) => {
    // Don't show current user in the list
    if (email === currentUserEmail) return false;

    // Don't show owner email in the list if not the owner
    if (!isOwner && email === file.ownerEmail) return false;

    return true;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emails = e.target.value.trim().split(",");
    onInputChange(emails);
  };

  // Check if current user can share this file
  const canShare = isOwner || file.allowReshare !== false;

  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        {/* Display the owner information */}
        <div className="flex items-center mb-4 p-2 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-500 mr-2">Owner:</p>
          <p className="text-sm font-medium">{ownerName}</p>
        </div>

        {!canShare && !isOwner && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md mb-4">
            The owner has disabled resharing of this file.
          </div>
        )}

        {isOwner && (
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-md">
            <label htmlFor="allow-reshare" className="text-sm font-medium">
              Allow others to reshare this file
            </label>
            <div className="relative">
              <input
                type="checkbox"
                id="allow-reshare"
                checked={allowReshare}
                onChange={handleAllowReshareChange}
                disabled={isUpdating}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin h-3 w-3 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="subtitle-2 pl-1 text-light-100">
          Share Files With Other Users
        </p>
        <input
          type="email"
          placeholder="Enter email address"
          onChange={handleInputChange}
          className="share-input-field"
          disabled={!canShare}
        />
        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Shared with</p>
            <p className="subtitle-2 text-light-200">
              {sharedUsers.length} users
            </p>
          </div>
          <ul className="pt-2">
            {sharedUsers.map((email: string) => (
              <li
                key={email}
                className="flex items-center justify-between gap-2"
              >
                <p className="subtitle-2">{email}</p>
                {/* Only show remove button if user is the owner */}
                {isOwner && (
                  <button onClick={() => onRemove(email)}>
                    <Image
                      src="/public/assets/icons/remove.svg"
                      alt="Remove"
                      width={24}
                      height={24}
                      className="cursor-pointer"
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
