import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { API_URL } from '../config';

const Signin = () => {
  const [SigninData, setSigninData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/signin`,
        SigninData
      );
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password.");
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
        className="relative z-10 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-80 border border-white/40"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">
          Signin
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={SigninData.username}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          disabled={isLoading}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={SigninData.password}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          disabled={isLoading}
        />

        <div className="text-right mb-4">
          <Link to="#" className="text-xs text-indigo-600 hover:underline">Forgot Password?</Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Signin"}
        </button>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signin;
