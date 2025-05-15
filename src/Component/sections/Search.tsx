"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFiles } from "@/lib/actions/file.actions";
import type { Models } from "node-appwrite";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";

type FileType = "image" | "document" | "video" | "audio" | "other";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResult] = useState<Models.Document[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const fetchFiles = async () => {
      if (!query) {
        setResult([]);
        setOpen(false);
        return router.push(path);
      }

      setLoading(true);
      const fileTypes: FileType[] = [
        "image",
        "document",
        "video",
        "audio",
        "other",
      ];
      const files = await getFiles({
        searchText: query,
        types: fileTypes,
      });

      setResult(files.documents);
      setOpen(true);
      setLoading(false);
    };

    fetchFiles();
  }, [query, path, router]);

  useEffect(() => {
    if (!searchQuery) setQuery("");
  }, [searchQuery]);

  const handleClickItem = (file: Models.Document) => {
    setOpen(false);
    setResult([]);

    console.log("Clicked File:", file);

    // Convert uppercase type to lowercase if needed
    const fileType = file.type?.toLowerCase() || "other";

    // Map the file type to the correct route using the utility function
    let routePath = "other";

    if (fileType === "video" || fileType === "audio") {
      routePath = "media";
    } else if (fileType === "image") {
      routePath = "images";
    } else if (fileType === "document") {
      routePath = "documents";
    } else {
      routePath = "others";
    }

    console.log(`Routing to: /${routePath}?query=${query}`);
    router.push(`/${routePath}?query=${query}`);
  };

  const highlightMatch = (text: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="text-primary font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image
          src="/public/assets/icons/search.svg"
          alt="search"
          width={24}
          height={24}
        />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />

        {open && (
          <ul className={`search-result ${open && !loading ? "open" : ""}`}>
            {loading ? (
              <div className="loading-spinner" />
            ) : results.length > 0 ? (
              results.map((file) => (
                <li
                  className="flex items-center justify-between"
                  key={file.$id}
                  onClick={() => handleClickItem(file)}
                >
                  <div className="flex cursor-pointer items-center gap-4">
                    <Thumbnail
                      type={file.type}
                      extension={file.extension}
                      url={file.url}
                      className="size-9 min-w-9"
                    />
                    <p className="subtitle-2 line-clamp-1 text-light-100">
                      {highlightMatch(file.name)}
                    </p>
                  </div>
                  <FormattedDateTime
                    date={file.$createdAt}
                    className="caption line-clamp-1 text-light-200"
                  />
                </li>
              ))
            ) : (
              <p className="empty-result">No Files Found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
