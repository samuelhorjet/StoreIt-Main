"use client";

import { cn, convertFileToUrl, getFileType } from "@/lib/utils";
import React, { useCallback, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import Thumbnail from "./Thumbnail";
import { MAX_FILE_SIZE } from "@/constants";
import { uploadFiles } from "@/lib/actions/file.actions";

interface Props {
  ownerId: string;
  accountId: string;
  className?: string;
}

const FileUploader = ({ ownerId, accountId, className }: Props) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const validFiles: File[] = [];

      for (const file of acceptedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast.custom((t) => (
            <div
              className="flex max-w-sm items-start gap-3 rounded-lg border border-red-500 bg-white p-4 shadow-lg cursor-pointer"
              onClick={() => toast.dismiss(t)}
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-red-500" />
              <div className="text-sm text-black">
                <p className="font-semibold">{file.name}</p>
                <p>is too large. Max size is 50MB.</p>
              </div>
            </div>
          ));
          continue;
        }

        validFiles.push(file);
        setFiles((prev) => [...prev, file]); // Add to UI

        try {
          const uploaded = await uploadFiles({
            file,
            ownerId,
            accountId,
            path: "/files",
          });

          if (uploaded) {
            // Remove from UI
            setFiles((prev) => prev.filter((f) => f.name !== file.name));
            toast.success(`${file.name} uploaded successfully`);
          }
        } catch (err) {
          console.error("Upload failed:", err);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [ownerId, accountId]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement>,
    fileName: string
  ) => {
    e.stopPropagation();
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  return (
    <div {...getRootProps()} className={cn("cursor-pointer", className)}>
      <input {...getInputProps()} />
      <button type="button" className="uploader-button">
        <Image
          src="/public/assets/icons/upload.svg"
          alt="upload"
          width={24}
          height={24}
        />
        <p className="text-white pl-3">Upload</p>
      </button>

      {files.length > 0 && (
        <ul className="uploader-preview-list">
          <h4 className="h4 text-light-100">Uploading</h4>
          {files.map((file, index) => {
            const { type, extension } = getFileType(file.name);
            return (
              <li
                key={`${file.name}-${index}`}
                className="uploader-preview-item"
              >
                <div className="flex items-center gap-3">
                  <Thumbnail
                    type={type}
                    extension={extension}
                    url={convertFileToUrl(file)}
                    imageClassName=""
                    className=""
                  />
                  <div className="flex flex-col max-w-[200px]">
                    <p className="truncate text-sm font-medium text-gray-800 max-w-full">
                      {file.name}
                    </p>
                    <Image
                      src="public/assets/icons/file-loader.gif"
                      alt="loader"
                      width={80}
                      height={26}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Image
                  src="public/assets/icons/remove.svg"
                  alt="remove"
                  width={24}
                  height={24}
                  onClick={(e) => handleRemoveFile(e, file.name)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

};

export default FileUploader;
