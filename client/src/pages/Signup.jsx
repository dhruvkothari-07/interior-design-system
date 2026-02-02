import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { API_URL } from '../config';

// Zod validation schema
const signupSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be less than 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string()
        .email("Please enter a valid email address")
        .max(100, "Email must be less than 100 characters"),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must be less than 100 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string()
        .min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const Signup = () => {
    const [signupData, setSignupData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

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
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    function validateForm() {
        try {
            signupSchema.parse(signupData);
            setErrors({});
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                const fieldErrors = {};
                err.errors.forEach((error) => {
                    if (error.path[0] && !fieldErrors[error.path[0]]) {
                        fieldErrors[error.path[0]] = error.message;
                    }
                });
                setErrors(fieldErrors);
            }
            return false;
        }
    }

    function validateField(fieldName, value) {
        try {
            const fieldSchema = {
                username: signupSchema.shape.username,
                email: signupSchema.shape.email,
                password: signupSchema.shape.password,
            };

            if (fieldSchema[fieldName]) {
                fieldSchema[fieldName].parse(value);
                return null;
            }
            return null;
        } catch (err) {
            if (err instanceof z.ZodError) {
                return err.errors[0]?.message;
            }
            return null;
        }
    }

    function handleBlur(e) {
        const { name, value } = e.target;
        if (name !== 'confirmPassword') {
            const error = validateField(name, value);
            if (error) {
                setErrors((prev) => ({ ...prev, [name]: error }));
            }
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
                `${API_URL}/signup`,
                { username: signupData.username, email: signupData.email, password: signupData.password }
            );

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
        if (passwordStrength <= 2) return "bg-rose-500";
        if (passwordStrength <= 3) return "bg-amber-500";
        return "bg-emerald-500";
    };

    const getStrengthText = () => {
        if (signupData.password.length === 0) return "";
        if (passwordStrength <= 2) return "Weak";
        if (passwordStrength <= 3) return "Medium";
        return "Strong";
    };

    const passwordsMatch = signupData.password && signupData.confirmPassword &&
        signupData.password === signupData.confirmPassword;

    return (
        <div className="min-h-screen flex bg-[var(--color-bg)]">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 via-[var(--color-accent)] to-orange-600 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-32 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/3 right-1/3 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
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
                        Start creating<br />
                        beautiful spaces<br />
                        today
                    </h1>

                    <p className="text-xl text-white/80 max-w-md mb-12">
                        Join thousands of interior designers who trust DesignFlow to manage their projects.
                    </p>

                    {/* Features List */}
                    <div className="space-y-4">
                        {[
                            'Unlimited projects & quotations',
                            'Material library with 500+ items',
                            'Client portal access',
                            'Export to PDF & Excel'
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check className="w-4 h-4" />
                                </div>
                                <span className="text-white/90">{feature}</span>
                            </div>
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
                            Create account
                        </h2>
                        <p className="text-[var(--color-text-secondary)] mt-2">
                            Get started with your free account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={signupData.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isLoading}
                                required
                                className={`input ${errors.username ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
                                placeholder="Choose a username"
                            />
                            {errors.username && (
                                <p className="text-xs text-rose-600 mt-1">{errors.username}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Email address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={signupData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isLoading}
                                required
                                className={`input ${errors.email ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
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
                                    value={signupData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isLoading}
                                    required
                                    className={`input pr-12 ${errors.password ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
                                    placeholder="Create a password"
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

                            {/* Password Strength */}
                            {signupData.password && !errors.password && (
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getStrengthColor()} transition-all duration-300`}
                                            style={{ width: `${(Math.min(passwordStrength, 5) / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-medium min-w-[50px] ${passwordStrength <= 2 ? 'text-rose-600' :
                                            passwordStrength <= 3 ? 'text-amber-600' : 'text-emerald-600'
                                        }`}>
                                        {getStrengthText()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Confirm password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={signupData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                    className={`input pr-12 ${errors.confirmPassword || (signupData.confirmPassword && !passwordsMatch)
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                            : ''
                                        }`}
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-xs text-rose-600 mt-1">{errors.confirmPassword}</p>
                            )}
                            {!errors.confirmPassword && signupData.confirmPassword && !passwordsMatch && (
                                <p className="text-xs text-rose-600 mt-1">Passwords don't match</p>
                            )}
                            {passwordsMatch && (
                                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Passwords match
                                </p>
                            )}
                        </div>

                        {/* Password Requirements Hint */}
                        <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] p-3 rounded-lg">
                            <p className="font-medium mb-1">Password must contain:</p>
                            <ul className="space-y-0.5">
                                <li className={signupData.password.length >= 6 ? 'text-emerald-600' : ''}>
                                    • At least 6 characters
                                </li>
                                <li className={/[A-Z]/.test(signupData.password) ? 'text-emerald-600' : ''}>
                                    • One uppercase letter
                                </li>
                                <li className={/[a-z]/.test(signupData.password) ? 'text-emerald-600' : ''}>
                                    • One lowercase letter
                                </li>
                                <li className={/[0-9]/.test(signupData.password) ? 'text-emerald-600' : ''}>
                                    • One number
                                </li>
                            </ul>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
                        >
                            {isLoading ? (
                                "Creating account..."
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--color-border)]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                                Already have an account?
                            </span>
                        </div>
                    </div>

                    {/* Sign In Link */}
                    <Link
                        to="/signin"
                        className="block w-full text-center py-3 px-4 rounded-xl border-2 border-[var(--color-border)] text-[var(--color-text-primary)] font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
                    >
                        Sign in instead
                    </Link>

                    {/* Footer */}
                    <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
                        By creating an account, you agree to our{" "}
                        <a href="#" className="text-[var(--color-accent)] hover:underline">Terms</a>
                        {" "}and{" "}
                        <a href="#" className="text-[var(--color-accent)] hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
