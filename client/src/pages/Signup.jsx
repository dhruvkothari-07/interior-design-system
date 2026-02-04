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

    const checklistItem = (label, met) => (
        <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${met ? 'bg-green-100' : 'bg-gray-100'}`}>
                {met && <Check className="w-2 h-2" />}
            </div>
            {label}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-[420px] p-8"
            >
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                        Create account
                    </h2>
                </div>

                <div className="space-y-5">
                    {/* Username Input */}
                    <div className="space-y-1.5">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-600">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            placeholder="Choose a username"
                            value={signupData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-theme-orange focus:ring-1 focus:ring-theme-orange transition-all placeholder:text-gray-400"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-600">
                            Email address
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="you@example.com"
                            value={signupData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-theme-orange focus:ring-1 focus:ring-theme-orange transition-all placeholder:text-gray-400"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                placeholder="Create a password"
                                value={signupData.password}
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

                    {/* Confirm Password Input */}
                    <div className="space-y-1.5">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600">
                            Confirm password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="Confirm your password"
                                value={signupData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-theme-orange focus:ring-1 focus:ring-theme-orange transition-all placeholder:text-gray-400 pr-10"
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Password must contain:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {checklistItem("At least 6 characters", signupData.password.length >= 6)}
                            {checklistItem("One uppercase", /[A-Z]/.test(signupData.password))}
                            {checklistItem("One lowercase", /[a-z]/.test(signupData.password))}
                            {checklistItem("One number", /[0-9]/.test(signupData.password))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#A05E3C] hover:bg-[#8B4D2E] text-white py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm mt-4"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account →"}
                    </button>

                    {/* Divider */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#FAF9F6] text-gray-400">Already have an account?</span>
                        </div>
                    </div>

                    {/* Sign In Link */}
                    <Link
                        to="/signin"
                        className="block w-full text-center py-3.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all bg-white"
                    >
                        Sign in instead
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default Signup;