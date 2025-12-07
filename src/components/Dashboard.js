import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { tripService } from '../services/tripService';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState('');

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.log('Failed to log out');
    }
  }

  // Load user's trips for stats and recent list
  useEffect(() => {
    let isMounted = true;

    async function loadTrips() {
      if (!currentUser) {
        setTrips([]);
        setTripsLoading(false);
        return;
      }

      setTripsLoading(true);
      setTripsError('');

      try {
        const allTrips = await tripService.getUserTrips(currentUser.uid);
        if (!isMounted) return;
        setTrips(allTrips || []);
      } catch (err) {
        console.error('Error loading trips on dashboard:', err);
        if (!isMounted) return;
        setTripsError(err.message || 'Failed to load trips');
        setTrips([]);
      } finally {
        if (isMounted) setTripsLoading(false);
      }
    }

    loadTrips();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const formatDate = (date) => {
    if (!date) return 'N/A';

    // Firestore Timestamp support
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    } else if (!(date instanceof Date)) {
      date = new Date(date);
    }

    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  // Derived stats
  const totalTrips = trips.length;
  const flightsCount = trips.filter((t) => t.type === 'flight').length;
  const vacationsCount = trips.filter((t) => t.type === 'vacation').length;

  const recentTrips = [...trips]
    .sort((a, b) => {
      const aTime =
        a.createdAt && typeof a.createdAt.toDate === 'function'
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt || 0).getTime();
      const bTime =
        b.createdAt && typeof b.createdAt.toDate === 'function'
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 3);

  const getTripLabel = (trip) => {
    if (trip.type === 'vacation') {
      return trip.destination || 'Vacation trip';
    }
    if (trip.type === 'flight' && trip.flight) {
      const from = trip.flight?.departure?.airport;
      const to = trip.flight?.arrival?.airport;
      if (from && to) return `${from} → ${to}`;
    }
    return trip.tripName || 'Saved trip';
  };

  const getTripTypeLabel = (trip) => {
    if (trip.type === 'vacation') return 'Vacation plan';
    if (trip.type === 'flight') return 'Flight';
    return 'Trip';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-main">
          <p className="dashboard-eyebrow">TripStore</p>
          <h1 className="dashboard-title">Welcome back!</h1>
          <p className="dashboard-subtitle">
            Search flights, save your favorite options, and turn them into
            vacation plans; all in one place.
          </p>

          <div className="dashboard-hero-actions">
            <Link to="/search-flights" className="btn-primary hero-primary">
              Search Flights
            </Link>
            <Link to="/stored-trips" className="btn-secondary hero-secondary">
              View Stored Trips
            </Link>
          </div>

          <p className="dashboard-footnote">
            Need to update your password?{' '}
            <Link to="/profile" className="dashboard-link">
              Go to profile settings
            </Link>
          </p>
        </div>

        <div className="dashboard-hero-side">
          <div className="dashboard-user-card">
            <span className="user-label">Signed in as</span>
            <span className="user-email">{currentUser?.email}</span>
            <button
              onClick={handleLogout}
              className="btn-secondary btn-sm logout-btn"
            >
              Logout
            </button>
          </div>

          <div className="dashboard-stat-card">
            <span className="stat-label">Quick tip</span>
            <p className="stat-text">
              Save both your outbound and return flights from the same search to
              track a complete round trip on the Stored Trips page.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-lower">
        <div className="dashboard-stat-grid">
          <div className="stat-card">
            <span className="stat-card-label">Total saved trips</span>
            <span className="stat-card-number">{totalTrips}</span>
            <span className="stat-card-caption">
              Flights and vacation plans combined
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Saved flights</span>
            <span className="stat-card-number">{flightsCount}</span>
            <span className="stat-card-caption">
              View them on the Stored Trips page
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Vacation plans</span>
            <span className="stat-card-number">{vacationsCount}</span>
            <span className="stat-card-caption">
              Create custom trips to plan ahead
            </span>
          </div>
        </div>

        <div className="dashboard-recent">
          <div className="recent-header">
            <h2>Recent trips</h2>
            <Link to="/stored-trips" className="dashboard-link">
              Open Stored Trips →
            </Link>
          </div>

          {tripsLoading && <p className="recent-helper">Loading your trips…</p>}

          {!tripsLoading && tripsError && (
            <p className="recent-error">
              {tripsError} — you can still manage trips on the Stored Trips
              page.
            </p>
          )}

          {!tripsLoading && !tripsError && recentTrips.length === 0 && (
            <p className="recent-helper">
              You don&apos;t have any saved trips yet. Start by{' '}
              <Link to="/search-flights" className="dashboard-link">
                searching for flights
              </Link>
              .
            </p>
          )}

          {!tripsLoading && !tripsError && recentTrips.length > 0 && (
            <div className="recent-list">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="recent-trip-card">
                  <div className="recent-main">
                    <div className="recent-title-row">
                      <span className="recent-title">{getTripLabel(trip)}</span>
                      <span className={`recent-type-badge ${trip.type}`}>
                        {getTripTypeLabel(trip)}
                      </span>
                    </div>
                    <div className="recent-meta">
                      <span>Created: {formatDate(trip.createdAt)}</span>
                      {trip.type === 'vacation' && trip.destination && (
                        <span>Destination: {trip.destination}</span>
                      )}
                      {trip.type === 'flight' && trip.flight && (
                        <span>
                          Airline: {trip.flight.airline}{' '}
                          {trip.flight.flightNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="recent-actions">
                    <Link to="/stored-trips" className="btn-secondary btn-sm">
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
