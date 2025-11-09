import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Signin = () => {
  const [SigninData, setSigninData] = useState({
    username: "",
    password: "",
  });
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
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/signin`,
        SigninData
      );
      localStorage.setItem("token", res.data.token);
      alert("Signin successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error during signin:", err);
      alert("Signin failed. Please check your credentials or try again.");
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

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={SigninData.username}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={SigninData.password}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition active:scale-[0.98]"
        >
          Signin
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
