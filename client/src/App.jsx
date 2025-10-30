import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Materials from "./pages/Materials";
import Quotations from "./pages/Quotations";
import Clients from "./pages/Clients"; // Import the new component
import QuotationSummary from "./pages/QuotationSummary"; // Import the new component
import QuotationDetail from "./pages/QuotationDetail"; // Import the new component

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} /> {/* Add the new clients route */}
                 <Route path="/quotations" element={<Quotations />} /> 
                <Route path="/quotations/:id/summary" element={<QuotationSummary />} /> {/* Add the new summary route */}
                <Route path="/quotations/:id" element={<QuotationDetail />} /> {/* Add the new route */}
            </Routes>
        </Router>
    );
};

export default App;
