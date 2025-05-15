"use client";

import React from "react";
import type { Models } from "node-appwrite";

interface TotalProps {
  files: Models.Document[];
}

const Total = ({ files }: TotalProps) => {
  const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2); // Convert to MB and round to 2 decimals

  return (
    <p className="body-1">
      Total: <span className="h5">{totalMB} MB</span>
    </p>
  );
};

export default Total;
