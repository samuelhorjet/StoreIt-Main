"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { avatarPlaceHolderUrl, navItems } from "@/constants";
import { cn } from "@/lib/utils";

interface props {
  fullName: string;
  avatar: string;
  email: string;
}

const Sidebar = ({ fullName, avatar, email }: props) => {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/">
        <Image
          src="/public/assets/icons/logo-full-brand.svg"
          alt="logo"
          width={140}
          height={40}
          className="hidden h-auto lg:block"
        />

        <Image
          src="/public/assets/icons/logo-brand.svg"
          alt="logo"
          width={40}
          height={40}
          className="lg:hidden h-auto"
        />
      </Link>
      <nav className="sidebar-nav">
        <ul className="flex flex-1 flex-col gap-2">
          {navItems.map(({ url, name, icon }) => (
            <Link key={name} href={url} className="lg:w-full">
              <li
                className={cn(
                  "sidebar-nav-item flex items-center gap-4 px-3 py-2 rounded-lg transition-colors",
                  pathname === url && "shad-active bg-[#fa7275] text-white"
                )}
              >
                <div className="bg-[#fa727493] p-3 rounded-full">
                  <Image
                    src={icon || "/placeholder.svg"}
                    alt={name}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <p className="hidden lg:block">{name}</p>
              </li>
            </Link>
          ))}
        </ul>
      </nav>
      <div className="sidebar-image-container">
        <Image
          src="/public/assets/images/files-2.png"
          alt="logo"
          width={400}
          height={400}
          className="w-full object-contain"
        />
      </div>
      <div className="sidebar-user-info mt-auto">
        <Image
          src={avatarPlaceHolderUrl || "/placeholder.svg"}
          alt={avatar}
          width={36}
          height={36}
          className="sidebar-user-avatar"
        />
        <div className="hidden lg:block">
          <p className="subtitle-2 capitalize">{fullName}</p>
          <p className="caption">{email}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
