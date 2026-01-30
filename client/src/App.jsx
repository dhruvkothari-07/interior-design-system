import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
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

const App = () => {
    return (
        <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <Routes>
                <Route path="/" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/quotations/:id" element={<QuotationDetail />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
            </Routes>
        </Router>
    );
};

export default App;
