import React from "react";
import TopNav from "./TopNav";

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-theme-cream">
            <TopNav />
            {/* Main content with top padding to account for fixed navbar */}
            <main className="pt-16">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
