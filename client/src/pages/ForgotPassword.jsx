import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { API_URL } from '../config';

const emailSchema = z.string().email("Please enter a valid email address");
const otpSchema = z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const ForgotPassword = () => {
    const navigate = useNavigate();

    // Multi-step state: 'email' | 'otp' | 'password' | 'success'
    const [step, setStep] = useState('email');

    // Form data
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 1: Send OTP to email
    async function handleSendOTP(e) {
        e.preventDefault();
        setError("");

        const result = emailSchema.safeParse(email);
        if (!result.success) {
            setError(result.error.errors[0].message);
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/forgot-password`, { email });
            toast.success("OTP sent to your email!");
            setStep('otp');
        } catch (err) {
            const message = err.response?.data?.message || "Failed to send OTP. Please try again.";
            toast.error(message);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    // Step 2: Verify OTP
    async function handleVerifyOTP(e) {
        e.preventDefault();
        setError("");

        const result = otpSchema.safeParse(otp);
        if (!result.success) {
            setError(result.error.errors[0].message);
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
            if (response.data.verified) {
                toast.success("OTP verified!");
                setStep('password');
            }
        } catch (err) {
            const message = err.response?.data?.message || "Invalid OTP. Please try again.";
            toast.error(message);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    // Step 3: Reset Password
    async function handleResetPassword(e) {
        e.preventDefault();
        setError("");

        const passResult = passwordSchema.safeParse(password);
        if (!passResult.success) {
            setError(passResult.error.errors[0].message);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/reset-password`, { email, otp, password });
            toast.success("Password reset successful!");
            setStep('success');
        } catch (err) {
            const message = err.response?.data?.message || "Failed to reset password. Please try again.";
            toast.error(message);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-[var(--color-bg)]">
            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Back Link */}
                    <Link
                        to="/signin"
                        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-8 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Sign In
                    </Link>

                    {/* Step 1: Email Input */}
                    {step === 'email' && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                    Forgot Password?
                                </h2>
                                <p className="text-[var(--color-text-secondary)] mt-2">
                                    Enter your email and we'll send you a 6-digit code.
                                </p>
                            </div>

                            <form onSubmit={handleSendOTP} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                            disabled={isLoading}
                                            required
                                            className={`input !pl-12 ${error ? 'border-rose-400' : ''}`}
                                            placeholder="Enter your email"
                                        />
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Mail size={18} className="text-[var(--color-text-muted)]" />
                                        </span>
                                    </div>
                                    {error && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
                                </div>

                                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                                    {isLoading ? "Sending..." : "Send OTP"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 2: OTP Input */}
                    {step === 'otp' && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                    Enter OTP
                                </h2>
                                <p className="text-[var(--color-text-secondary)] mt-2">
                                    We sent a 6-digit code to <strong>{email}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOTP} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Verification Code
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(""); }}
                                            disabled={isLoading}
                                            required
                                            maxLength={6}
                                            className={`input !pl-12 text-center text-2xl tracking-[0.5em] font-mono ${error ? 'border-rose-400' : ''}`}
                                            placeholder="000000"
                                        />
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <KeyRound size={18} className="text-[var(--color-text-muted)]" />
                                        </span>
                                    </div>
                                    {error && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
                                    <p className="text-xs text-[var(--color-text-muted)] mt-2">Code expires in 10 minutes</p>
                                </div>

                                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                                    {isLoading ? "Verifying..." : "Verify OTP"}
                                </button>

                                <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
                                    Use a different email
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 3: New Password */}
                    {step === 'password' && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                    Create New Password
                                </h2>
                                <p className="text-[var(--color-text-secondary)] mt-2">
                                    Enter your new password below.
                                </p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                            disabled={isLoading}
                                            required
                                            className="input !pl-12 pr-12"
                                            placeholder="Enter new password"
                                        />
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Lock size={18} className="text-[var(--color-text-muted)]" />
                                        </span>
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                            disabled={isLoading}
                                            required
                                            className="input !pl-12 pr-12"
                                            placeholder="Confirm new password"
                                        />
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Lock size={18} className="text-[var(--color-text-muted)]" />
                                        </span>
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {error && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
                                </div>

                                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={32} className="text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                                Password Reset!
                            </h2>
                            <p className="text-[var(--color-text-secondary)] mb-6">
                                Your password has been successfully reset.
                            </p>
                            <button onClick={() => navigate('/signin')} className="btn-primary w-full py-3">
                                Sign In Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
