import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from '../config';

const Signin = () => {
  const [SigninData, setSigninData] = useState({
    username: "",
    password: "",
  });
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
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] p-8"
      >
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Welcome back
          </h2>
        </div>

        <div className="space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-600">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="Enter your username"
              value={SigninData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-theme-orange focus:ring-1 focus:ring-theme-orange transition-all placeholder:text-gray-400"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder="Enter your password"
                value={SigninData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-theme-orange focus:ring-1 focus:ring-theme-orange transition-all placeholder:text-gray-400 pr-10"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 border-gray-300 rounded text-theme-orange focus:ring-theme-orange"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900">Remember me</span>
            </label>
            <Link to="#" className="text-sm font-medium text-theme-orange hover:text-orange-700">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#A05E3C] hover:bg-[#8B4D2E] text-white py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In →"}
          </button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#FAF9F6] text-gray-400">New to DesignFlow?</span>
            </div>
          </div>

          {/* Create Account Link */}
          <Link
            to="/signup"
            className="block w-full text-center py-3.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all bg-white"
          >
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signin;
