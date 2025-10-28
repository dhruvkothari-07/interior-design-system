import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
                "http://localhost:3001/api/v1/signup",
                signupData
            );

            console.log("Signup response:", res.data);
            alert("Signup successful!");
            navigate("/dashboard");
        } catch (err) {
            console.error("Error while signup:", err);
            alert("Signup failed!");
        }
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl shadow-md w-80"
            >
                <h2 className="text-xl font-semibold mb-4 text-center">Signup</h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={signupData.username}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={signupData.password}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400">Submit
                </button>
            </form>
        </div>
    );
};

export default Signup;