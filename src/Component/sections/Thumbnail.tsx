import React from "react";
import Image from "next/image";
import { cn, getFileIcon } from "@/lib/utils";

interface Props {
  type: string;
  extension: string;
  url: string;
  imageClassName?: string;
  className?: string;
}

const Thumbnail = ({
  type,
  extension,
  url = "",
  imageClassName = "",
  className = "",
}: Props) => {
  const normalizedType = type.toUpperCase();
  const isImage = normalizedType === "IMAGE";

  return (
    <figure className={cn("thumbnail", className)}>
      <Image
        src={isImage ? url : getFileIcon(extension, normalizedType)}
        alt="thumbnail"
        width={100}
        height={100}
        unoptimized
        className={cn(
          "size-8 object-contain",
          imageClassName,
          isImage && "thumbnail-image"
        )}
      />
    </figure>
  );
};

export default Thumbnail;
