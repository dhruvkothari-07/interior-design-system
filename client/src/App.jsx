import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Materials from "./pages/Materials";
import Quotations from "./pages/Quotations";
import Clients from "./pages/Clients";
import QuotationDetail from "./pages/QuotationDetail";
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ClientDetail from './pages/ClientDetail';
import RoomMaterials from './pages/RoomMaterials';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import CommandPalette from './components/CommandPalette';

const App = () => {
    // Global Command Palette State
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCommandOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/signin" replace />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Layout Routes */}
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/materials" element={<Materials />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/quotations" element={<Quotations />} />
                    <Route path="/quotations/:id" element={<QuotationDetail />} />
                    <Route path="/quotations/:quotationId/rooms/:roomId" element={<RoomMaterials />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;
