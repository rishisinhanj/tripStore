import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tripService } from '../services/tripService';
import { Link } from 'react-router-dom';

export default function StoredTrips() {
  const [trips, setTrips] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'flights', 'vacations'
  const { currentUser } = useAuth();

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!currentUser) {
        console.log('❌ No current user found');
        setLoading(false);
        return;
      }

      console.log('✅ Current user found:', {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      });

      console.log('Testing database connection...');
      try {
        await tripService.testConnection();
        console.log('Database connection successful');
      } catch (connError) {
        console.error('Database connection failed:', connError);
        setError('Database connection failed. Please check your internet connection.');
        setLoading(false);
        return;
      }

      console.log('Loading trips for user:', currentUser.uid);
      
      // Load trips first
      try {
        const allTrips = await tripService.getUserTrips(currentUser.uid);
        console.log('Got trips:', allTrips);
        setTrips(allTrips);
      } catch (tripError) {
        console.error('Error loading trips:', tripError);
        setError('Failed to load trips: ' + tripError.message);
        setTrips([]);
      }

      // Load vacations separately
      try {
        const userVacations = await tripService.getUserVacations(currentUser.uid);
        console.log('Got vacations:', userVacations);
        setVacations(userVacations);
      } catch (vacationError) {
        console.error('Error loading vacations:', vacationError);
        // Don't override the error if trips already failed
        if (!error) {
          setError('Failed to load vacation plans: ' + vacationError.message);
        }
        setVacations([]);
      }
      
    } catch (error) {
      console.error('General error loading trips:', error);
      setError('Failed to load trips: ' + error.message);
      setTrips([]);
      setVacations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, error]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const deleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await tripService.deleteTrip(tripId);
        await loadTrips(); // Reload both trips and vacations
      } catch (error) {
        setError('Failed to delete trip: ' + error.message);
      }
    }
  };

  const getFilteredTrips = () => {
    switch (activeTab) {
      case 'flights':
        return trips.filter(trip => trip.type === 'flight');
      case 'vacations':
        return trips.filter(trip => trip.type === 'vacation');
      default:
        return trips;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h3>Loading your trips...</h3>
        <p>This should only take a moment</p>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();
  const flightCount = trips.filter(trip => trip.type === 'flight').length;
  const vacationCount = trips.filter(trip => trip.type === 'vacation').length;

  return (
    <div className="stored-trips-container">
      <div className="page-header">
        <h1>My Stored Trips</h1>
        <p>Manage your saved flights and vacation plans</p>
        <div className="header-actions">
          <Link to="/search-flights" className="btn-secondary">Search More Flights</Link>
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          {error}
          <button 
            onClick={() => loadTrips()} 
            className="btn-secondary btn-sm"
            style={{ marginLeft: '15px' }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="trips-controls">
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({trips.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => setActiveTab('flights')}
          >
            Saved Flights ({flightCount})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vacations' ? 'active' : ''}`}
            onClick={() => setActiveTab('vacations')}
          >
            Vacation Plans ({vacationCount})
          </button>
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary create-btn"
          >
            {showCreateForm ? 'Cancel' : '+ Create Vacation Plan'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <CreateVacationForm 
          onVacationCreated={loadTrips} 
          onCancel={() => setShowCreateForm(false)}
          existingVacations={vacations}
        />
      )}

      {filteredTrips.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div className="trips-grid">
          {filteredTrips.map(trip => (
            <TripCard 
              key={trip.id} 
              trip={trip} 
              onDelete={() => deleteTrip(trip.id)}
              vacations={vacations}
              onTripUpdated={loadTrips}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ activeTab }) {
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'flights':
        return {
          title: 'No flights saved yet',
          description: 'Start by searching for flights and saving your favorites!',
          action: { text: 'Search Flights', link: '/search-flights' }
        };
      case 'vacations':
        return {
          title: 'No vacation plans yet',
          description: 'Create a vacation plan to organize your dream trips!',
          action: { text: 'Create Vacation Plan', action: 'create' }
        };
      default:
        return {
          title: 'No trips saved yet',
          description: 'Start planning your adventures by searching flights or creating vacation plans!',
          action: { text: 'Search Flights', link: '/search-flights' }
        };
    }
  };

  const message = getEmptyMessage();

  return (
    <div className="empty-state">
      <div className="empty-icon">✈️</div>
      <h3>{message.title}</h3>
      <p>{message.description}</p>
      {message.action.link ? (
        <Link to={message.action.link} className="btn-primary">
          {message.action.text}
        </Link>
      ) : (
        <button className="btn-primary" onClick={() => window.scrollTo(0, 0)}>
          {message.action.text}
        </button>
      )}
    </div>
  );
}

// Trip Card Component
function TripCard({ trip, onDelete, vacations, onTripUpdated }) {
  const [showFlightOptions, setShowFlightOptions] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date instanceof Date ? date.toLocaleDateString() : new Date(date).toLocaleDateString();
  };

  const handleAddToVacation = async (vacationId) => {
    try {
      if (trip.type === 'flight') {
        await tripService.addFlightToVacation(vacationId, trip.flight);
        alert('Flight added to vacation!');
        setShowFlightOptions(false);
        onTripUpdated();
      }
    } catch (error) {
      alert('Failed to add flight to vacation: ' + error.message);
    }
  };

  return (
    <div className="trip-card">
      <div className="trip-header">
        <h3>{typeof trip.tripName === 'string' ? trip.tripName : 'Untitled Trip'}</h3>
        <div className="trip-badges">
          <span className={`trip-type-badge ${trip.type}`}>
            {trip.type === 'vacation' ? 'Vacation' : 'Flight'}
          </span>
          <span className={`status-badge ${trip.status}`}>
            {trip.status}
          </span>
        </div>
      </div>

      <div className="trip-content">
        {trip.type === 'flight' && trip.flight ? (
          <FlightTripContent trip={trip} formatDate={formatDate} />
        ) : (
          <VacationTripContent trip={trip} formatDate={formatDate} />
        )}
      </div>

      <div className="trip-actions">
        <div className="trip-meta">
          <span className="created-date">Created: {formatDate(trip.createdAt)}</span>
          <span className="total-cost">${trip.totalCost || trip.budget || 0}</span>
        </div>
        
        <div className="action-buttons">
          {trip.type === 'flight' && vacations.length > 0 && (
            <div className="add-to-vacation">
              <button 
                onClick={() => setShowFlightOptions(!showFlightOptions)}
                className="btn-secondary btn-sm"
              >
                Add to Vacation
              </button>
              
              {showFlightOptions && (
                <div className="vacation-dropdown">
                  <h4>Add to which vacation?</h4>
                  {vacations.map(vacation => (
                    <button
                      key={vacation.id}
                      onClick={() => handleAddToVacation(vacation.id)}
                      className="vacation-option"
                    >
                      {vacation.tripName}
                      <span className="vacation-dates">
                        {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                      </span>
                    </button>
                  ))}
                  <button 
                    onClick={() => setShowFlightOptions(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button onClick={onDelete} className="btn-danger btn-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Flight Trip Content
function FlightTripContent({ trip, formatDate }) {
  const flight = trip.flight;
  return (
    <div className="flight-trip-content">
      <div className="flight-route">
        <div className="route-line">
          <span className="airport">{flight.departure?.airport}</span>
          <span className="arrow">→</span>
          <span className="airport">{flight.arrival?.airport}</span>
        </div>
        <div className="cities">
          {flight.departure?.city} → {flight.arrival?.city}
        </div>
      </div>
      <div className="flight-details">
        <div className="detail-row">
          <span className="label">Airline:</span>
          <span className="value">{flight.airline} {flight.flightNumber}</span>
        </div>
        <div className="detail-row">
          <span className="label">Departure:</span>
          <span className="value">{formatDate(trip.searchParams?.departDate)} at {flight.departure?.time}</span>
        </div>
        <div className="detail-row">
          <span className="label">Passengers:</span>
          <span className="value">{typeof trip.passengers === 'number' ? trip.passengers : trip.searchParams?.passengers || 1}</span>
        </div>
        <div className="detail-row">
          <span className="label">Duration:</span>
          <span className="value">{flight.duration}</span>
        </div>
        {flight.stops > 0 && (
          <div className="detail-row">
            <span className="label">Stops:</span>
            <span className="value">{flight.stops}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Vacation Trip Content
function VacationTripContent({ trip, formatDate }) {
  return (
    <div className="vacation-trip-content">
      <div className="vacation-overview">
        <div className="destination-info">
          <h4 className="destination">{trip.destination}</h4>
          <div className="date-range">
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </div>
        </div>
      </div>

      <div className="vacation-details">
        <div className="detail-row">
          <span className="label">Travelers:</span>
          <span className="value">{typeof trip.passengers === 'number' ? trip.passengers : 1} {(typeof trip.passengers === 'number' ? trip.passengers : 1) === 1 ? 'person' : 'people'}</span>
        </div>
        
        {trip.accommodation && typeof trip.accommodation === 'string' && (
          <div className="detail-row">
            <span className="label">Accommodation:</span>
            <span className="value">{trip.accommodation}</span>
          </div>
        )}
        
        {trip.activities && Array.isArray(trip.activities) && trip.activities.length > 0 && (
          <div className="detail-row">
            <span className="label">Activities:</span>
            <span className="value">{trip.activities.join(', ')}</span>
          </div>
        )}
        
        {trip.notes && typeof trip.notes === 'string' && (
          <div className="detail-row">
            <span className="label">Notes:</span>
            <span className="value">{trip.notes}</span>
          </div>
        )}

        {trip.flights && trip.flights.length > 0 && (
          <div className="vacation-flights">
            <span className="label">Saved Flights:</span>
            <div className="flights-list">
              {trip.flights.map((flight, index) => (
                <div key={index} className="mini-flight">
                  {flight.departure?.airport} → {flight.arrival?.airport} 
                  <span className="flight-airline">({flight.airline})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Vacation Form Component
function CreateVacationForm({ onVacationCreated, onCancel, existingVacations }) {
  const [formData, setFormData] = useState({
    tripName: '',
    destination: '',
    startDate: '',
    endDate: '',
    passengers: 1,
    budget: '',
    accommodation: '',
    activities: [],
    notes: ''
  });
  const [activityInput, setActivityInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.tripName.trim()) {
      setError('Trip name is required');
      return;
    }
    
    if (!formData.destination.trim()) {
      setError('Destination is required');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      return;
    }
    
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const tripData = {
        ...formData,
        budget: formData.budget ? parseInt(formData.budget) : 0,
        activities: formData.activities || []
      };
      
      console.log('Submitting vacation data:', tripData);
      
      await tripService.createCustomTrip(currentUser.uid, tripData);
      
      onVacationCreated();
      onCancel();
      
    } catch (error) {
      console.error('Error creating vacation:', error);
      setError('Failed to create vacation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = () => {
    if (activityInput.trim() && !formData.activities.includes(activityInput.trim())) {
      setFormData({
        ...formData,
        activities: [...formData.activities, activityInput.trim()]
      });
      setActivityInput('');
    }
  };

  const removeActivity = (activityToRemove) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter(activity => activity !== activityToRemove)
    });
  };

  return (
    <div className="create-vacation-form">
      <h3>Create Vacation Plan</h3>
      
      {error && <div className="error-alert">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Vacation Name *</label>
            <input
              type="text"
              value={formData.tripName}
              onChange={(e) => setFormData({...formData, tripName: e.target.value})}
              placeholder="e.g., Summer Europe Trip"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Destination *</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
              placeholder="e.g., Paris, France"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="form-group">
            <label>End Date *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Travelers</label>
            <select
              value={formData.passengers}
              onChange={(e) => setFormData({...formData, passengers: parseInt(e.target.value)})}
            >
              {[1,2,3,4,5,6,7,8].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Budget</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              placeholder="Enter budget in USD"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Accommodation</label>
          <input
            type="text"
            value={formData.accommodation}
            onChange={(e) => setFormData({...formData, accommodation: e.target.value})}
            placeholder="e.g., Hilton Paris, Airbnb in Montmartre"
          />
        </div>

        <div className="form-group">
          <label>Activities</label>
          <div className="activity-input">
            <input
              type="text"
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              placeholder="Add an activity"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
            />
            <button type="button" onClick={addActivity} className="btn-secondary btn-sm">
              Add
            </button>
          </div>
          {formData.activities.length > 0 && (
            <div className="activity-tags">
              {formData.activities.map((activity, index) => (
                <span key={index} className="activity-tag">
                  {activity}
                  <button 
                    type="button" 
                    onClick={() => removeActivity(activity)}
                    className="remove-tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Add any notes about your vacation plans..."
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Vacation Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}