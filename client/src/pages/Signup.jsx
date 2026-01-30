import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from '../config';

const Signup = () => {
    const [signupData, setSignupData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

    // Check password strength
    useEffect(() => {
        const password = signupData.password;
        let score = 0;
        if (password.length > 5) score++;
        if (password.length > 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        setPasswordStrength(score);
    }, [signupData.password]);

    function handleChange(e) {
        const { name, value } = e.target;
        setSignupData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // Frontend Validation
        if (signupData.password !== signupData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (signupData.password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
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
            toast.success("Account created successfully!");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || "Signup failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    const getStrengthColor = () => {
        if (passwordStrength <= 2) return "bg-red-500";
        if (passwordStrength <= 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthText = () => {
        if (signupData.password.length === 0) return "";
        if (passwordStrength <= 2) return "Weak";
        if (passwordStrength <= 3) return "Medium";
        return "Strong";
    };

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
                        Create Account
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">Join us and start your journey</p>
                </div>

                {/* Username Input */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        name="username"
                        id="username"
                        placeholder=" "
                        value={signupData.username}
                        onChange={handleChange}
                        className="peer w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
                        disabled={isLoading}
                        required
                    />
                    <label
                        htmlFor="username"
                        className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600
                        peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600"
                    >
                        Username
                    </label>
                </div>

                {/* Email Input */}
                <div className="relative mb-6">
                    <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder=" "
                        value={signupData.email}
                        onChange={handleChange}
                        className="peer w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
                        disabled={isLoading}
                        required
                    />
                    <label
                        htmlFor="email"
                        className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600
                        peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600"
                    >
                        Email Address
                    </label>
                </div>

                {/* Password Input */}
                <div className="relative mb-2">
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            id="password"
                            placeholder=" "
                            value={signupData.password}
                            onChange={handleChange}
                            className="peer w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white pr-10 [&::-ms-reveal]:hidden"
                            disabled={isLoading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-indigo-600 transition-colors bg-white"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <label
                            htmlFor="password"
                            className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1
                            peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600
                            peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600"
                        >
                            Password
                        </label>
                    </div>
                </div>

                {/* Password Strength Indicator */}
                <div className="mb-6 h-6">
                    {signupData.password && (
                        <div className="flex items-center gap-2 transition-all duration-500 ease-in-out">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getStrengthColor()} transition-all duration-500`}
                                    style={{ width: `${(Math.min(passwordStrength, 5) / 5) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 min-w-[50px] text-right">{getStrengthText()}</span>
                        </div>
                    )}
                </div>


                {/* Confirm Password Input */}
                <div className="relative mb-8">
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            id="confirmPassword"
                            placeholder=" "
                            value={signupData.confirmPassword}
                            onChange={handleChange}
                            className="peer w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white pr-10 [&::-ms-reveal]:hidden"
                            disabled={isLoading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-indigo-600 transition-colors bg-white"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <label
                            htmlFor="confirmPassword"
                            className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1
                            peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600
                            peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600"
                        >
                            Confirm Password
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
                </button>

                <p className="text-center text-gray-500 mt-8 text-sm">
                    Already have an account?{" "}
                    <Link to="/signin" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;