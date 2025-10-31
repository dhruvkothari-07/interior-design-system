import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    const navLinkClasses = ({ isActive }) =>
        `block py-2 px-4 rounded transition ${isActive ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'}`;

    return (
        <aside className="w-64 bg-gray-800 text-white p-5 hidden md:flex flex-col justify-between">
            <div>
                <h1 className="text-2xl font-bold mb-8 text-center">Management</h1>
                <nav>
                    <ul className="space-y-3">
                        <li><NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink></li>
                        <li><NavLink to="/quotations" className={navLinkClasses}>Quotations</NavLink></li>
                        <li><NavLink to="/clients" className={navLinkClasses}>Clients</NavLink></li>
                        <li><NavLink to="/materials" className={navLinkClasses}>Materials</NavLink></li>
                    </ul>
                </nav>
            </div>
            <div className="w-full">
                <a href="/signin"
                    onClick={() => localStorage.removeItem('token')}
                    className="block py-2 px-4 rounded hover:bg-red-700 bg-red-600 text-center transition">
                    Logout
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;