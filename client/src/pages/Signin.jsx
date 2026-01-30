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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-50">
      {/* Blur Glow */}
      <div className="absolute w-96 h-96 bg-indigo-200 opacity-30 blur-3xl rounded-full pointer-events-none"></div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-[400px] border border-white/40 animate-fade-in-up"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-gray-500 mt-2 text-sm">Please enter your details to sign in</p>
        </div>

        {/* Username Input with Floating Label */}
        <div className="relative mb-6">
          <input
            type="text"
            name="username"
            id="username"
            value={SigninData.username}
            onChange={handleChange}
            className="peer w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
            disabled={isLoading}
            required
          />
          <label
            htmlFor="username"
            className={`absolute left-3 transition-all duration-200 pointer-events-none bg-white px-1
                        ${SigninData.username ? '-top-2.5 text-xs text-indigo-600' : 'top-3 text-gray-500'}
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600`}
          >
            Username
          </label>
        </div>

        {/* Password Input with Floating Label */}
        <div className="relative mb-6">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={SigninData.password}
              onChange={handleChange}
              className="peer w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white pr-10 [&::-ms-reveal]:hidden"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              onMouseDown={(e) => e.preventDefault()}
              className="absolute right-3 top-3 text-gray-400 hover:text-indigo-600 transition-colors bg-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <label
              htmlFor="password"
              className={`absolute left-3 transition-all duration-200 pointer-events-none bg-white px-1
                        ${SigninData.password ? '-top-2.5 text-xs text-indigo-600' : 'top-3 text-gray-500'}
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600`}
            >
              Password
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600"></div>
              <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="ml-2 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Remember me</span>
          </label>
          <Link to="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors hover:underline">Forgot Password?</Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
        </button>

        <p className="text-center text-gray-500 mt-8 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signin;
