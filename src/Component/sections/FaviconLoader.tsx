"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FaviconLoader() {
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => {
      const favicon = document.querySelector(
        "link[rel='icon']"
      ) as HTMLLinkElement;
      if (favicon) favicon.href = "/favicon-loading.svg";
    };

    const handleComplete = () => {
      const favicon = document.querySelector(
        "link[rel='icon']"
      ) as HTMLLinkElement;
      if (favicon) favicon.href = "/favicon.svg";
    };

    // Override push to simulate loading behavior
    const originalPush = router.push;

    router.push = (href, options) => {
      handleStart();
      setTimeout(() => {
        handleComplete(); // delay to simulate route complete
      }, 600);
      return originalPush(href, options);
    };

    return () => {
      router.push = originalPush; // clean up
    };
  }, [router]);

  return null;
}
