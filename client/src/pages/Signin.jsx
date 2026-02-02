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
  const [rememberMe, setRememberMe] = useState(false);
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
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
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
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-accent)] via-orange-500 to-amber-500 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">DesignFlow</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Manage your<br />
            interior design<br />
            projects with ease
          </h1>

          <p className="text-xl text-white/80 max-w-md">
            Streamline your workflow, track materials, and create stunning quotations for your clients.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 mt-12">
            {['Project Tracking', 'Material Library', 'Client Management', 'Quotations'].map((feature) => (
              <span key={feature} className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1" />
          </svg>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[var(--color-accent)] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">DesignFlow</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Welcome back
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Sign in to your account to continue
            </p>
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

            {/* Remember / Forgot */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                Remember me
              </label>

              <Link
                to="#"
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
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                New to DesignFlow?
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

          {/* Footer */}
          <p className="text-center text-xs text-[var(--color-text-muted)] mt-8">
            By signing in, you agree to our{" "}
            <a href="#" className="text-[var(--color-accent)] hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-[var(--color-accent)] hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;
