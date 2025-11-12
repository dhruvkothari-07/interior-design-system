import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
const navLinkClasses = ({ isActive }) =>
  `block py-2 px-4 rounded-md transition-colors ${
    isActive
      ? 'bg-gray-700 text-white font-medium'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
  }`;


    return (
        <aside className="w-64 bg-gray-800 text-white p-5 hidden md:flex flex-col justify-between shadow-lg">
            <div>
                <h1 className="text-2xl tracking-tight text-gray-300 mb-8 text-center">Management</h1>
                <nav>
                    <ul className="space-y-3">
                        <li><NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink></li>
                        <li><NavLink to="/quotations" className={navLinkClasses}>Quotations</NavLink></li>
                        <li><NavLink to="/clients" className={navLinkClasses}>Clients</NavLink></li>
                        <li><NavLink to="/projects" className={navLinkClasses}>Projects</NavLink></li>
                        <li><NavLink to="/materials" className={navLinkClasses}>Materials</NavLink></li>
                        
                    </ul>
                </nav>
            </div>
            <div className="w-full">
                <a href="/signin"
                    onClick={() => localStorage.removeItem('token')}
                    className="block py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-center font-medium transition active:scale-[0.98]"
>
                    Logout
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;