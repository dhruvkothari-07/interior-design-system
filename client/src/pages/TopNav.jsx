import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    Users,
    FolderKanban,
    Package,
    LogOut,
    Menu,
    X,
    Settings
} from "lucide-react";

const TopNav = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState('staff');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || 'staff');
            } catch (e) {
                console.error("Token decode error", e);
            }
        }
    }, []);

    const navLinkClasses = ({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
            ? "bg-theme-orange text-white shadow-lg shadow-orange-200"
            : "text-gray-600 hover:bg-orange-50 hover:text-theme-orange"
        }`;

    const mobileNavLinkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive
            ? "bg-theme-orange text-white"
            : "text-gray-700 hover:bg-orange-50"
        }`;

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/signin");
        setIsMobileMenuOpen(false);
    };

    const allNavItems = [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ['admin', 'staff'] },
        { to: "/quotations", icon: FileText, label: "Quotations", roles: ['admin', 'staff'] },
        { to: "/clients", icon: Users, label: "Clients", roles: ['admin', 'staff'] },
        { to: "/projects", icon: FolderKanban, label: "Projects", roles: ['admin', 'staff'] },
        { to: "/materials", icon: Package, label: "Materials", roles: ['admin', 'staff'] },
        { to: "/settings", icon: Settings, label: "Settings", roles: ['admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* Desktop Top Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo / Brand */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-theme-orange to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                                <span className="text-white font-bold text-lg">I</span>
                            </div>
                            <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:block">InterioStudio</span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <NavLink key={item.to} to={item.to} className={navLinkClasses}>
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        {/* Desktop Logout */}
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            aria-label="Toggle Menu"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Panel */}
            <div className={`fixed top-16 left-0 right-0 bottom-0 z-40 bg-white transform transition-transform duration-300 ease-out md:hidden ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full pointer-events-none"
                }`}>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={mobileNavLinkClasses}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </nav>
            </div>
        </>
    );
};

export default TopNav;
