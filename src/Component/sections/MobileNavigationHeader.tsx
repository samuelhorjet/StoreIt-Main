"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/Component/ui/separator";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/Component/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/constants";
import FileUploader from "./FileUploader";
import { signOutUser } from "@/lib/actions/user.actions";

interface props {
  $id: string;
  accountId: string;
  fullName: string;
  avatar: string;
  email: string;
}

const MobileNavigationHeader = ({
  $id: ownerId,
  accountId,
  fullName,
  avatar,
  email,
}: props) => {
  const [isOpen, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div>
      <header className="mobile-header">
        <Image
          src="/public/assets/icons/logo-full-brand.svg"
          alt="logo"
          width={120}
          height={52}
          className="h-auto"
        />
        <Sheet open={isOpen} onOpenChange={setOpen}>
          <SheetTrigger>
            <Image
              src="/public/assets/icons/menu.svg"
              alt="search"
              width={38}
              height={38}
            />
          </SheetTrigger>
          <SheetContent className="shad-sheet bg-white/70 h-screen px-3">
            <SheetTitle>
              <div className="header-user">
                <Image
                  src={avatar}
                  alt="avatar"
                  width={44}
                  height={44}
                  className="header-user-avatar"
                />
                <div className="sm:hidden lg:block">
                  <p className="subtitle-2 capitalize">{fullName}</p>
                  <p className="caption">{email}</p>
                </div>
              </div>
              <Separator className="mb-4 bg-light-200/20" />
            </SheetTitle>
            <nav className="mobile-nav">
              <ul className="mobile-nav-list">
                {navItems.map(({ url, name, icon }) => (
                  <Link key={name} href={url} className="lg:w-full">
                    <li
                      className={cn(
                        "mobile-nav-item",
                        pathname === url && "shad-active"
                      )}
                    >
                      <Image
                        src={icon}
                        alt={name}
                        width={24}
                        height={24}
                        className={cn(
                          "-nav-icon",
                          pathname === url && "nav-icon-active"
                        )}
                      />
                      <p>{name}</p>
                    </li>
                  </Link>
                ))}
              </ul>
            </nav>
            <Separator className="my-5 bg-light-200/20" />
            <div className="flex flex-col justify-between gap-5 pb-30">
              <FileUploader ownerId={"ownerId"} accountId={"accountId"} />
              <button
                type="submit"
                className="mobile-sign-out-button"
                onClick={async () => await signOutUser()}
              >
                <Image
                  src="/public/assets/icons/logout.svg"
                  alt="logo"
                  width={24}
                  height={24}
                />
                <p>Logout</p>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </div>
  );
};

export default MobileNavigationHeader;
