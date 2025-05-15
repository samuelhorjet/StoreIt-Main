"use client";

import Image from "next/image";
import type React from "react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Component/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Component/ui/dropdown-menu";

import type { Models } from "node-appwrite";
import { actionsDropdownItems } from "@/constants/index";
import { constructDownloadUrl } from "@/lib/utils";
import {
  renameFile,
  updateFileUsers,
  removeUserFromFile,
  checkUserExists,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { FileDetails, ShareInput } from "./ActionsModel";

type UpdateFileUsersProps = {
  fileId: string;
  emails: string[];
  path: string;
};

type ActionType = {
  label: string;
  icon: string;
  value: string;
};

const Dropdown = ({ file }: { file: Models.Document }) => {
  const [fileData, setFileData] = useState(file); // updated local file state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const path = usePathname();
  const [emails, setEmails] = useState<string[]>([]);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [allowReshare, setAllowReshare] = useState<boolean>(
    fileData.allowReshare !== false
  );

  const closeAllModals = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(fileData.name); // reset to current value
    setShareError(null);
    setShareSuccess(null);
  };

  const handleAction = async () => {
    if (!action) return;
    setIsLoading(true);
    setShareError(null); // Reset error message
    setShareSuccess(null); // Reset success message

    const actions = {
      rename: async () => {
        const updated = await renameFile({
          fileId: fileData.$id,
          name,
          extension: fileData.extension,
          path,
        });

        if (updated) {
          setFileData((prev) => ({ ...prev, name }));
        }
        return updated;
      },

      share: async () => {
        // Check if emails array is empty
        if (!emails.length) {
          setShareError("Please enter at least one email address");
          setIsLoading(false);
          return false;
        }

        // Check if all emails exist before sharing
        for (const email of emails) {
          const userExists = await checkUserExists(email);
          if (!userExists) {
            setShareError(`User not found: ${email}`);
            setIsLoading(false);
            return false;
          }
        }

        // If all users exist, proceed with sharing
        const result = await updateFileUsers({
          fileId: fileData.$id,
          emails,
          path,
        });

        if (result) {
          setShareSuccess(
            `Successfully shared your file to ${emails.join(", ")}`
          );
          // Update the local file data with new users
          setFileData((prev) => ({
            ...prev,
            users: result.users || prev.users,
          }));
          return result;
        }

        return false;
      },

      delete: async () => {
        try {
          // Call deleteFile directly instead of removeUserFromFile
          const { deleteFile } = await import("@/lib/actions/file.actions");
          const success = await deleteFile({
            fileId: fileData.$id,
            bucketFileId: fileData.bucketField,
            path,
          });

          if (success) {
            closeAllModals();
          }
          return success;
        } catch (error) {
          console.error("Error deleting file:", error);
          setShareError(
            error instanceof Error ? error.message : "Failed to delete file"
          );
          return false;
        }
      },
    };

    try {
      const success = await actions[action.value as keyof typeof actions]();
      if (success && action.value !== "share") {
        closeAllModals();
      }
    } catch (error) {
      console.error(`Error during ${action.value} action:`, error);
      if (error instanceof Error) {
        setShareError(error.message);
      } else {
        setShareError(`An error occurred during ${action.value}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUsers = async (email: string) => {
    try {
      setIsLoading(true);
      setShareError(null);

      // Use the removeUserFromFile function
      const success = await removeUserFromFile({
        fileId: file.$id,
        emailToRemove: email,
        path,
      });

      if (success) {
        // Update local state to reflect the change
        setFileData((prev) => ({
          ...prev,
          users: prev.users.filter((e: string) => e !== email),
        }));
        setShareSuccess(`Successfully removed ${email} from shared users`);
      }
    } catch (error) {
      console.error("Error removing user:", error);
      if (error instanceof Error) {
        setShareError(error.message);
      } else {
        setShareError("Failed to remove user");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllowReshareChange = (allow: boolean) => {
    setAllowReshare(allow);
    setFileData((prev) => ({ ...prev, allowReshare: allow }));
  };

  const handleClick = (actionItem: ActionType) => {
    setAction(actionItem);
    if (["rename", "share", "delete", "details"].includes(actionItem.value)) {
      setIsMenuOpen(true);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Show loading state
      setIsLoading(true);

      // Fetch the file content from Appwrite
      const response = await fetch(constructDownloadUrl(fileData.bucketField));
      const blob = await response.blob();

      // Create a new blob with the same content
      const newBlob = new Blob([blob], { type: blob.type });

      // Create an object URL for the blob
      const blobUrl = URL.createObjectURL(newBlob);

      // Create a temporary anchor element
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;

      // Set the download attribute to the current name (with extension if needed)
      const fileExtension = fileData.extension ? `.${fileData.extension}` : "";
      downloadLink.download = `${fileData.name}${fileExtension}`;

      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // You could add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  const renderDialogContent = () => {
    if (!action) return null;
    const { value, label } = action;

    return (
      <DialogContent className="bg-white rounded-xl shadow-xl w-[400px] max-w-full">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center">{label}</DialogTitle>
          {value === "rename" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          )}
          {value === "details" && <FileDetails file={fileData} />}
          {value === "share" && (
            <>
              <ShareInput
                file={fileData}
                onInputChange={setEmails}
                onRemove={handleRemoveUsers}
                onAllowReshareChange={handleAllowReshareChange}
              />
              {shareError && (
                <div className="text-red-500 text-sm mt-2">{shareError}</div>
              )}
              {shareSuccess && (
                <div className="text-green-500 text-sm mt-2">
                  {shareSuccess}
                </div>
              )}
            </>
          )}
          {value === "delete" && (
            <p className="delete-confirmation text-sm text-gray-700">
              Are you sure you want to delete
              <br />
              <span className="inline-block max-w-[200px] truncate overflow-hidden whitespace-nowrap align-bottom text-red-600">
                {file.name}
              </span>
            </p>
          )}
        </DialogHeader>

        {["rename", "delete", "share"].includes(value) && (
          <DialogFooter className="flex flex-row justify-center items-center gap-7">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
              onClick={closeAllModals}
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              className="bg-[#fa7275] hover:bg-[#ff797b] text-white py-2 px-4 rounded flex items-center gap-2"
            >
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/public/assets/icons/loader.svg"
                  alt="loader"
                  width={20}
                  height={20}
                />
              )}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  return (
    <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/public/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white min-w-[220px] rounded-xl p-2 shadow-lg">
          <DropdownMenuLabel className="max-w-[200px] truncate font-semibold text-sm text-gray-800 mb-1">
            {fileData.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleClick(actionItem)}
            >
              {actionItem.value === "download" ? (
                <div
                  className="flex items-center gap-3 w-full cursor-pointer"
                  onClick={handleDownload}
                >
                  {isLoading && actionItem.value === "download" ? (
                    <Image
                      src="/public/assets/icons/loader.svg"
                      alt="loading"
                      width={20}
                      height={20}
                    />
                  ) : (
                    <Image
                      src={actionItem.icon || "/placeholder.svg"}
                      alt={actionItem.label}
                      width={20}
                      height={20}
                    />
                  )}
                  <span className="text-sm text-gray-700">
                    {isLoading && actionItem.value === "download"
                      ? "Downloading..."
                      : actionItem.label}
                  </span>
                </div>
              ) : (
                <>
                  <Image
                    src={actionItem.icon || "/placeholder.svg"}
                    alt={actionItem.label}
                    width={20}
                    height={20}
                  />
                  <span className="text-sm text-gray-700">
                    {actionItem.label}
                  </span>
                </>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};

export default Dropdown;
