"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Component/ui/alert-dialog";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/Component/ui/input-otp";

import { sendEmailOTP, verifySecret } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

const RESEND_COOLDOWN = 30; // seconds

const OtpModal = ({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (password.length !== 6) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const sessionId = await verifySecret({ accountId, password });
      if (sessionId) {
        router.push("/");
      }
    } catch (error) {
      console.log("Failed to verify OTP:", error);
      setErrorMessage("Code is not correct");
    }

    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await sendEmailOTP({ email });
      setSuccessMessage("Code has been resent successfully");
      setResendCooldown(RESEND_COOLDOWN);
    } catch (error) {
      console.error("Resend OTP error:", error);
      setErrorMessage("Failed to resend code. Please try again.");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader className="relative flex justify-center">
          <AlertDialogTitle className="h2 text-center">
            Enter Your OTP
            <Image
              src="/public/assets/icons/close-dark.svg"
              alt="close"
              width={20}
              height={20}
              onClick={() => setIsOpen(false)}
              className="otp-close-button"
            />
          </AlertDialogTitle>
          <AlertDialogDescription className="subtitle-2 text-center text-light-100">
            We&apos;ve sent a code to
            <span className="pl-1 text-brand">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <InputOTP maxLength={6} value={password} onChange={setPassword}>
          <InputOTPGroup className="shad-otp">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="shad-otp-slot text-brand"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {errorMessage && (
          <p className="text-sm text-red-500 text-center mt-2">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-green-500 text-center mt-2">
            {successMessage}
          </p>
        )}

        <AlertDialogFooter>
          <div className="flex w-full flex-col gap-4">
            <AlertDialogAction
              onClick={handleSubmit}
              className={`shad-submit-btn text-white h-12 ${
                password.length !== 6 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              type="button"
              disabled={password.length !== 6 || isLoading}
            >
              Submit
              {isLoading && (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full ml-2"></div>
              )}
            </AlertDialogAction>

            <div className="subtitle-2 mt-2 text-center text-light-100">
              Didn&apos;t get a code?
              {resendCooldown > 0 ? (
                <span className="pl-1 text-gray-400">
                  Resend available in {resendCooldown}s...
                </span>
              ) : (
                <button
                  type="button"
                  className="pl-1 text-brand cursor-pointer"
                  onClick={handleResendOTP}
                >
                  Click to resend
                </button>
              )}
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OtpModal;
