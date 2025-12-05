import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { amadeusAPI } from '../services/amadeusAPI';
import { Link } from 'react-router-dom';

export default function FlightSearch() {
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1
  });
  
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState(null); // Track the params used for current results
  const { currentUser } = useAuth();

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const results = await amadeusAPI.searchFlightOffers(searchParams);
      setSearchResults(results);
      setLastSearchParams(searchParams); // Store the search params that generated these results
      
    } catch (error) {
      setError(error.message);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalPrice = (flight) => {
    return flight.price * searchParams.passengers;
  };

  return (
    <div className="flight-search-container">
      <div className="flight-search-header">
        <div className="header-content">
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1>Search Flights</h1>
          <p>Find the perfect flight for your next adventure</p>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Search Form */}
      <div className="search-form-container">
        <form onSubmit={handleSearch} className="flight-search-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="from">From</label>
              <input
                type="text"
                id="from"
                value={searchParams.from}
                onChange={(e) => handleInputChange('from', e.target.value)}
                placeholder="e.g., New York, JFK, London"
                autoComplete="off"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="to">To</label>
              <input
                type="text"
                id="to"
                value={searchParams.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                placeholder="e.g., Chicago, Miami, Tokyo"
                autoComplete="off"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="departDate">Departure Date</label>
              <input
                type="date"
                id="departDate"
                value={searchParams.departDate}
                onChange={(e) => handleInputChange('departDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="returnDate">Return Date (Optional)</label>
              <input
                type="date"
                id="returnDate"
                value={searchParams.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                min={searchParams.departDate || new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="passengers">Passengers</label>
              <select
                id="passengers"
                value={searchParams.passengers}
                onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                disabled={loading}
              >
                {[1,2,3,4,5,6].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group search-button-group">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary search-button"
              >
                {loading && <span className="loading-spinner"></span>}
                {loading ? 'Searching Flights...' : 'Search Flights'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="search-results">
          <div className="results-header">
            <h2>Search Results</h2>
            <p>
              Found {searchResults.totalResults} flights from {lastSearchParams?.from} to {lastSearchParams?.to}
            </p>
          </div>

          {/* Outbound Flights */}
          {searchResults.outbound.length > 0 && (
            <div className="flights-section">
              <h3>Outbound Flights - {formatDate(lastSearchParams?.departDate)}</h3>
              <div className="flights-list">
                {searchResults.outbound.map(flight => (
                  <div key={flight.id} className="flight-card">
                    <div className="flight-main-info">
                      <div className="airline-info">
                        <h4>{flight.airline}</h4>
                        <span className="flight-number">{flight.flightNumber}</span>
                      </div>
                      
                      <div className="flight-route">
                        <div className="departure">
                          <span className="time">{flight.departure.time}</span>
                          <span className="airport">{flight.departure.airport}</span>
                          <span className="city">{flight.departure.city}</span>
                        </div>
                        
                        <div className="flight-duration">
                          <div className="duration-line"></div>
                          <span className="duration">{flight.duration}</span>
                        </div>
                        
                        <div className="arrival">
                          <span className="time">{flight.arrival.time}</span>
                          <span className="airport">{flight.arrival.airport}</span>
                          <span className="city">{flight.arrival.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flight-details">
                      <div className="price-info">
                        <span className="price-per-person">${flight.price}/person</span>
                        <span className="total-price">
                          Total: ${getTotalPrice(flight)}
                        </span>
                      </div>
                      <span className="flight-class">{flight.class}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return Flights */}
          {searchResults.return.length > 0 && (
            <div className="flights-section">
              <h3>Return Flights - {formatDate(lastSearchParams?.returnDate)}</h3>
              <div className="flights-list">
                {searchResults.return.map(flight => (
                  <div key={`return-${flight.id}`} className="flight-card">
                    <div className="flight-main-info">
                      <div className="airline-info">
                        <h4>{flight.airline}</h4>
                        <span className="flight-number">{flight.flightNumber}</span>
                      </div>
                      
                      <div className="flight-route">
                        <div className="departure">
                          <span className="time">{flight.departure.time}</span>
                          <span className="airport">{flight.departure.airport}</span>
                          <span className="city">{flight.departure.city}</span>
                        </div>
                        
                        <div className="flight-duration">
                          <div className="duration-line"></div>
                          <span className="duration">{flight.duration}</span>
                        </div>
                        
                        <div className="arrival">
                          <span className="time">{flight.arrival.time}</span>
                          <span className="airport">{flight.arrival.airport}</span>
                          <span className="city">{flight.arrival.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flight-details">
                      <div className="price-info">
                        <span className="price-per-person">${flight.price}/person</span>
                        <span className="total-price">
                          Total: ${getTotalPrice(flight)}
                        </span>
                      </div>
                      <span className="flight-class">{flight.class}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchResults.totalResults === 0 && (
            <div className="no-results">
              <h3>No flights found</h3>
              <p>Try searching with different cities or dates.</p>
              <div className="suggested-routes">
                <h4>Popular destinations:</h4>
                <ul>
                  <li>New York ↔ Los Angeles</li>
                  <li>Chicago ↔ Miami</li>
                  <li>San Francisco ↔ New York</li>
                  <li>London ↔ Paris</li>
                  <li>Tokyo ↔ Seoul</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}