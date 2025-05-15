"use client";

import Link from "next/link";
import type { Models } from "node-appwrite";
import Thumbnail from "./Thumbnail";
import { convertFileSize } from "@/lib/utils";
import FormattedDateTime from "./FormattedDateTime";
import { useEffect, useState } from "react";
import Dropdown from "./Dropdown";
import { getOwnerNameForFile } from "@/lib/actions/owner.actions";

const Cardb = ({ file }: { file: Models.Document }) => {
  const [ownerName, setOwnerName] = useState<string>("Loading...");

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        // Use a server action instead of directly creating an admin client
        const ownerData = await getOwnerNameForFile(file);
        setOwnerName(ownerData.ownerName);
      } catch (error) {
        console.error("Error fetching owner:", error);
        setOwnerName("Unknown");
      }
    };

    fetchOwner();
  }, [file]);

  return (
    <Link
      href={file.url}
      target="_blank"
      className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 relative w-full max-w-[370px] ml-1 h-[155px] md:max-w-[180px] md:h-[155px] lg:max-w-[235px] lg:h-[155px]"
    >
      <div className="flex justify-between items-start mb-6">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          url={file.url}
          imageClassName="w-8 h-8"
          className="w-8 h-8"
        />
        <div className="flex justify-between flex-col items-center">
          <Dropdown file={file} />
          <p className="text-sm font-medium text-gray-700">
            {convertFileSize(file.size)}
          </p>
        </div>
      </div>

      {/* File name */}
      <h3 className="font-medium text-gray-900 mb-1 truncate">{file.name}</h3>

      {/* Date and owner */}
      <div className="absolute bottom-4 left-4 right-4">
        <FormattedDateTime date={file.$createdAt} className="text-light-200" />
        <p className="text-xs text-gray-500 pt-1.5">By: {ownerName}</p>
      </div>
    </Link>
  );
};

export default Cardb;
