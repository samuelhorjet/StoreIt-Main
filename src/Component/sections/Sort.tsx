"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortTypes } from "@/constants";

const Sort = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const sortValue = searchParams.get("sort") || sortTypes[0].value;

  return (
    <Select onValueChange={handleSort} defaultValue={sortValue}>
      <SelectTrigger className="sort-select">
        <SelectValue placeholder="Sort..." />
      </SelectTrigger>
      <SelectContent className="bg-white sort-select-content">
        {sortTypes.map((sortOption) => (
          <SelectItem
            key={sortOption.value}
            value={sortOption.value}
            className="shad-select-item"
          >
            {sortOption.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Sort;
