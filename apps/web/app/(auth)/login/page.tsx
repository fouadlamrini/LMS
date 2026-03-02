'use client';
import { useAuth } from "@/providers/AuthProvider";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError("");
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      console.log("Caught error in component:", err.message);
      setServerError(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        {/* Wrap content in a form tag */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface rounded-2xl shadow-lg border border-border p-8"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <LockKeyhole className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-foreground mb-2">Welcome Back</h1>
          <p className="text-center text-muted mb-8">Sign in to continue to your account</p>

          {serverError && (
            <div className="mb-6 p-4 bg-error/10 border border-error rounded-xl">
              <p className="text-error text-sm text-center">{serverError}</p>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-foreground text-sm font-medium mb-2">Email Address</label>
            <input
              placeholder="your@email.com"
              {...register("email")}
              className={`w-full px-4 py-3 bg-background border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-secondary transition-all ${errors.email ? "border-error" : "border-border"
                }`}
            />
            {errors.email && <p className="text-error text-xs mt-2">{errors.email.message}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-foreground text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={`w-full px-4 py-3 bg-background border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-secondary transition-all ${errors.password ? "border-error" : "border-border"
                }`}
            />
            {errors.password && <p className="text-error text-xs mt-2">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all shadow-lg disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}