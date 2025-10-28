import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
        const res = await axios.post("http://localhost:3001/api/v1/signin", SigninData)
        localStorage.setItem("token", res.data.token)
        navigate("/dashboard")
        console.log("User token:", res.data.token);

    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl shadow-md w-80"
            >
                <h2 className="text-xl font-semibold mb-4 text-center">Signin</h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={SigninData.username}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={SigninData.password}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                />

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    Signin
                </button>
            </form>
        </div>
    );
};

export default Signin;
