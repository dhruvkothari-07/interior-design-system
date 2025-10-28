import React, { useState } from "react";
import axios from "axios";
const Login = () => {
    const [loginData, setLoginData] = useState({
        username: "",
        password: "",
    });


    function handleChange(e) {
        const { name, value } = e.target;
        setLoginData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const res = await axios.post("/localhost:5000/api/v1/login", loginData)
        localStorage.setItem("token", res.data.token)
        console.log("User token:", res.data.token);

    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl shadow-md w-80"
            >
                <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={loginData.username}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                />

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;
