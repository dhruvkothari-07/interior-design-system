import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from '../config';

const Signup = () => {
    const [signupData, setSignupData] = useState({
        username: "",
        password: "",
    });
    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;
        setSignupData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }
    async function handleSubmit(e) {
        e.preventDefault();
        console.log("Submitting signup data:", signupData);

        try {
            const res = await axios.post(
                `${API_URL}/signup`,
                signupData
            );

            console.log("Signup response:", res.data);
            alert("Signup successful!");
            navigate("/signin");
        } catch (err) {
            console.error("Error while signup:", err);
            alert("Signup failed!");
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
                    Create an Account
                </h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={signupData.username}
                    onChange={handleChange}
                    className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={signupData.password}
                    onChange={handleChange}
                    className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition active:scale-[0.98]">
                    Sign Up
                </button>

                <p className="text-center text-gray-600 mt-6 text-sm">
                    Already have an account?{" "}
                    <Link to="/signin" className="font-semibold text-indigo-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;