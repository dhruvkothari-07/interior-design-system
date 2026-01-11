import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { API_URL } from '../config';

const Signup = () => {
    const [signupData, setSignupData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        setError("");

        // Frontend Validation
        if (signupData.password !== signupData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (signupData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await axios.post(
                `${API_URL}/signup`,
                { username: signupData.username, email: signupData.email, password: signupData.password }
            );

            // Auto-login logic
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed. Please try again.");
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
                    Create an Account
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
                    value={signupData.username}
                    onChange={handleChange}
                    className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    disabled={isLoading}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={signupData.email}
                    onChange={handleChange}
                    className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    disabled={isLoading}
                    required
                />

                <div className="relative mb-4">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={signupData.password}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition pr-10 [&::-ms-reveal]:hidden"
                        disabled={isLoading}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <div className="relative mb-4">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={signupData.confirmPassword}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition pr-10 [&::-ms-reveal]:hidden"
                        disabled={isLoading}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
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