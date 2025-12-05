import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import FlightSearch from './components/FlightSearch';
import StoredTrips from './components/StoredTrips';
import './App.css';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/search-flights" 
              element={
                <PrivateRoute>
                  <FlightSearch />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/stored-trips" 
              element={
                <PrivateRoute>
                  <StoredTrips />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;