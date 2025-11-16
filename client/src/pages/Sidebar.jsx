import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderKanban,
  Package,
  LogOut
} from "lucide-react";

const Sidebar = () => {
  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 py-2 px-4 rounded-md transition-colors ${
      isActive
        ? "bg-gray-700 text-white font-medium"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <aside className="w-64 bg-gray-800 text-white p-5 hidden md:flex flex-col justify-between shadow-lg">
      {/* TOP SECTION */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-200 mb-8 text-center">
          Management
        </h1>

        <nav>
          <ul className="space-y-3">

            <li>
              <NavLink to="/dashboard" className={navLinkClasses}>
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </NavLink>
            </li>

            <li>
              <NavLink to="/quotations" className={navLinkClasses}>
                <FileText className="w-5 h-5" />
                Quotations
              </NavLink>
            </li>

            <li>
              <NavLink to="/clients" className={navLinkClasses}>
                <Users className="w-5 h-5" />
                Clients
              </NavLink>
            </li>

            <li>
              <NavLink to="/projects" className={navLinkClasses}>
                <FolderKanban className="w-5 h-5" />
                Projects
              </NavLink>
            </li>

            <li>
              <NavLink to="/materials" className={navLinkClasses}>
                <Package className="w-5 h-5" />
                Materials
              </NavLink>
            </li>

          </ul>
        </nav>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="w-full">
        <a
          href="/signin"
          onClick={() => localStorage.removeItem("token")}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-center font-medium transition active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
