import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { API_URL } from '../config';

// Zod validation schema
const signinSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
});

const Signin = () => {
  const [SigninData, setSigninData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setSigninData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validateForm() {
    try {
      signinSchema.parse(SigninData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0]] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/signin`,
        SigninData
      );
      localStorage.setItem("token", res.data.token);
      toast.success("Successfully signed in!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">


          {/* Header */}
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Welcome back
            </h2>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={SigninData.username}
                onChange={handleChange}
                disabled={isLoading}
                required
                className={`input ${errors.username ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="text-xs text-rose-600 mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={SigninData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={`input pr-12 ${errors.password ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end items-center">
              <Link
                to="/forgot-password"
                className="text-sm text-[var(--color-accent)] hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                New to InteriorDesk?
              </span>
            </div>
          </div>
          {/* Sign Up Link */}
          <Link
            to="/signup"
            className="block w-full text-center py-3 px-4 rounded-xl border-2 border-[var(--color-border)] text-[var(--color-text-primary)] font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signin;
