import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.log('Failed to log out');
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>TripStore Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Search Flights</h3>
            <p>Find and book your next trip</p>
            <Link to="/search-flights" className="btn-primary">
              Search Flights
            </Link>
          </div>

          <div className="dashboard-card">
            <h3>Stored Trips</h3>
            <p>View and manage your saved trips</p>
            <button className="btn-primary">View Trips</button>
          </div>

          <div className="dashboard-card">
            <h3>Profile Settings</h3>
            <p>Update your account information</p>
            <Link to="/profile" className="btn-primary">Edit Profile</Link>
          </div>
        </div>
      </div>
    </div>
  );
}