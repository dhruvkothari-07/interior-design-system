import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderKanban,
  Package,
  LogOut,
  Menu,
  X
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 py-2 px-4 rounded-md transition-colors ${
      isActive
        ? "bg-gray-700 text-white font-medium"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 text-white z-50 flex items-center px-4 shadow-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="ml-4 font-semibold text-lg tracking-tight">Management</span>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white p-5 flex flex-col justify-between shadow-lg transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 mt-16 md:mt-0`}>
      {/* TOP SECTION */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-200 mb-8 text-center hidden md:block">
          Management
        </h1>

        <nav>
          <ul className="space-y-3">

            <li>
              <NavLink to="/dashboard" className={navLinkClasses} onClick={closeMenu}>
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </NavLink>
            </li>

            <li>
              <NavLink to="/quotations" className={navLinkClasses} onClick={closeMenu}>
                <FileText className="w-5 h-5" />
                Quotations
              </NavLink>
            </li>

            <li>
              <NavLink to="/clients" className={navLinkClasses} onClick={closeMenu}>
                <Users className="w-5 h-5" />
                Clients
              </NavLink>
            </li>

            <li>
              <NavLink to="/projects" className={navLinkClasses} onClick={closeMenu}>
                <FolderKanban className="w-5 h-5" />
                Projects
              </NavLink>
            </li>

            <li>
              <NavLink to="/materials" className={navLinkClasses} onClick={closeMenu}>
                <Package className="w-5 h-5" />
                Materials
              </NavLink>
            </li>

          </ul>
        </nav>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="w-full">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/signin");
            closeMenu();
          }}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-center font-medium transition active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
