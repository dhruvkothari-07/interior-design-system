import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import axios from "axios"
const Materials = () => {
    const [materials, setMaterials] = useState([]);
    useEffect(() => {
        const fetchmaterials = async () => {
            try {   
                const token = localStorage.getItem("token");
                if (!token) {
                    return console.log("token missing")
                }
                const res = await axios.get("http://localhost:3001/api/v1/materials", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!res) {
                    return console.log("Materials not found")
                }
                setMaterials(res.data)

            }
            catch (err) {
                return console.log("Error fetching Materials", err)
            }
        }
        fetchmaterials();

    }, [])

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Materials</h1>
            {materials.length > 0 ? (
                <ul>
                    {materials.map((item, index) => (
                        <li key={index}>{item.name}</li>
                    ))}
                </ul>
            ) : (
                <p>No materials found</p>
            )}
        </div>
    );
}


export default Materials
