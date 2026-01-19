import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import GSTInvoiceScanner from './components/GSTInvoiceScanner';
import GoogleSheet from './components/GoogleSheet';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-semibold text-gray-800">Invoice Tools</span>
          </div>
          <div className="flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              GST Invoice Scanner
            </Link>
            <Link
              to="/google-sheet"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === '/google-sheet'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Google Sheets
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* <Navigation /> */}
        
        <Routes>
          {/* <Route path="/" element={<GSTInvoiceScanner />} /> */}
          <Route path="/" element={<GoogleSheet />} />
          {/* <Route path="/google-sheet" element={<GoogleSheet />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;