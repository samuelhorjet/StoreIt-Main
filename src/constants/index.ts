export const navItems = [
  {
    name: "Dashboard",
    icon: "/public/assets/icons/dashboard.svg",
    url: "/",
  },
  {
    name: "Documents",
    icon: "/public/assets/icons/documents.svg",
    url: "/documents",
  },
  {
    name: "Images",
    icon: "/public/assets/icons/images.svg",
    url: "/images",
  },
  {
    name: "Media",
    icon: "/public/assets/icons/video.svg",
    url: "/media",
  },
  {
    name: "Others",
    icon: "/public/assets/icons/others.svg",
    url: "/others",
  },
];

export const actionsDropdownItems = [
  {
    label: "Rename",
    icon: "/public/assets/icons/edit.svg",
    value: "rename",
  },
  {
    label: "Details",
    icon: "/public/assets/icons/info.svg",
    value: "details",
  },
  {
    label: "Share",
    icon: "/public/assets/icons/share.svg",
    value: "share",
  },
  {
    label: "Download",
    icon: "/public/assets/icons/download.svg",
    value: "download",
  },
  {
    label: "Delete",
    icon: "/public/assets/icons/delete.svg",
    value: "delete",
  },
];

export const sortTypes = [
  {
    label: "Date created (newest)",
    value: "$createdAt-desc",
  },
  {
    label: "Created Date (oldest)",
    value: "$createdAt-asc",
  },
  {
    label: "Name (A-Z)",
    value: "name-asc",
  },
  {
    label: "Name (Z-A)",
    value: "name-desc",
  },
  {
    label: "Size (Highest)",
    value: "size-desc",
  },
  {
    label: "Size (Lowest)",
    value: "size-asc",
  },
];

export const avatarPlaceHolderUrl =
  "https://i.pinimg.com/736x/fc/04/73/fc047347b17f7df7ff288d78c8c281cf.jpg";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
