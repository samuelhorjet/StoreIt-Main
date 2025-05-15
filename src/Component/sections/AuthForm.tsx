"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/Component/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/Component/ui/form";
import { Input } from "@/Component/ui/input";
import { useState } from "react";
import Link from "next/link";
import { createAccount, signInUser } from "@/lib/actions/user.actions";
import OtpModal from "./otpmodel";

type FormType = "sign-in" | "sign-up";

const AuthFormSchema = (formType: FormType) =>
  z.object({
    email: z.string().email("Please enter a valid email address"),
    fullname:
      formType === "sign-up"
        ? z.string().min(2, "Full name too short").max(50)
        : z.string().optional(),
  });

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);

  const formSchema = AuthFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // Validate inputs before sending to server
      if (
        type === "sign-up" &&
        (!values.fullname || values.fullname.trim().length < 2)
      ) {
        throw new Error(
          "Full name is required and must be at least 2 characters"
        );
      }

      if (!values.email || !values.email.includes("@")) {
        throw new Error("Valid email is required");
      }

      if (type === "sign-up") {
        const response = await createAccount({
          fullName: values.fullname || "",
          email: values.email,
        });

        setAccountId(response.accountId);
      } else {
        // Sign in flow
        const response = await signInUser({ email: values.email });

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.accountId) {
          setAccountId(response.accountId);
        } else {
          throw new Error("Failed to sign in");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);

      // Display more specific error message if available
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          type === "sign-up"
            ? "Failed to create account. Please try again"
            : "Failed to sign in. Please try again"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title mb-8">
            {type === "sign-in" ? "Sign In" : "Sign Up"}
          </h1>

          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item mb-8">
                    <FormLabel className="shad-form-label">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Your Full Name"
                        className="shad-input"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item mb-8">
                  <FormLabel className="shad-form-label">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Your Email"
                      className="shad-input"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />

          <Button
            className="form-submit-button text-white flex items-center gap-2"
            type="submit"
            disabled={isLoading}
          >
            {type === "sign-in" ? "Sign In" : "Sign Up"}
            {isLoading && (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full ml-2"></div>
            )}
          </Button>

          {errorMessage && (
            <div className="error-message mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          {accountId && (
            <div className="success-message mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
              {type === "sign-up"
                ? "Account created successfully! Check your email for verification."
                : "Check your email for the verification code."}
            </div>
          )}

          <div className="body-2 flex justify-center mt-8">
            <p className="text-light-100">
              {type === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={type === "sign-in" ? "/sign-up" : "/sign-in"}
              className="ml-1 font-medium text-brand"
            >
              {type === "sign-in" ? "Sign Up" : "Sign In"}
            </Link>
          </div>
        </form>
      </Form>
      {accountId && (
        <OtpModal email={form.getValues("email")} accountId={accountId} />
      )}
    </>
  );
};

export default AuthForm;
