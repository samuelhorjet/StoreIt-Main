import Header from "@/Component/sections/Header";
import MobileNavigationHeader from "@/Component/sections/MobileNavigationHeader";
import Sidebar from "@/Component/sections/Sidebar";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import React from "react";
import { Toaster } from "@/Component/ui/sonner";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const currentUser = await getCurrentUser(); // ✅ Await the promise

  if (!currentUser) return redirect("/sign-in");

  return (
    <main className="flex h-screen">
      <Sidebar {...currentUser} />
      <section className="flex h-full flex-1 flex-col">
        <MobileNavigationHeader {...currentUser} />
        <Header userId={currentUser.$id} accountId={currentUser.accountId} />
        <div className="main-content">{children}</div>
      </section>
      <Toaster />
    </main>
  );
};

export default Layout;
