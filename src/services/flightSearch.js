import { amadeusAPI } from './amadeusAPI';

// Popular destinations for autocomplete/suggestions
const popularDestinations = [
  { city: 'New York', airport: 'JFK', iata: 'NYC' },
  { city: 'Los Angeles', airport: 'LAX', iata: 'LAX' },
  { city: 'Chicago', airport: 'ORD', iata: 'CHI' },
  { city: 'Miami', airport: 'MIA', iata: 'MIA' },
  { city: 'San Francisco', airport: 'SFO', iata: 'SFO' },
  { city: 'Boston', airport: 'BOS', iata: 'BOS' },
  { city: 'London', airport: 'LHR', iata: 'LON' },
  { city: 'Paris', airport: 'CDG', iata: 'PAR' },
  { city: 'Tokyo', airport: 'NRT', iata: 'TYO' },
  { city: 'Amsterdam', airport: 'AMS', iata: 'AMS' }
];

class FlightSearchService {
  constructor() {
    this.useRealAPI = true; // Toggle to switch between real API and mock data
  }

  // Simulate API delay for better UX
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Search flights using Amadeus API
  async searchFlights({ from, to, departDate, returnDate, passengers = 1 }) {
    try {
      // Add a small delay for better UX (show loading state)
      await this.delay(300);
      
      // Validate inputs
      if (!from || !to || !departDate) {
        throw new Error('Please fill in all required search fields (From, To, Departure Date)');
      }

      // Validate date is not in the past
      const today = new Date();
      const searchDate = new Date(departDate);
      if (searchDate < today.setHours(0, 0, 0, 0)) {
        throw new Error('Departure date cannot be in the past');
      }

      // Validate return date if provided
      if (returnDate) {
        const returnSearchDate = new Date(returnDate);
        if (returnSearchDate < searchDate) {
          throw new Error('Return date cannot be before departure date');
        }
      }

      console.log('Searching flights with Amadeus API:', { from, to, departDate, returnDate, passengers });

      // Call Amadeus API
      const results = await amadeusAPI.searchFlightOffers({
        from: from.trim(),
        to: to.trim(),
        departDate,
        returnDate,
        passengers: parseInt(passengers),
        maxResults: 20
      });

      console.log('Amadeus API results:', results);
      
      return results;
      
    } catch (error) {
      console.error('Flight search error:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Authentication failed') || error.message.includes('401')) {
        throw new Error('Unable to connect to flight search service. Please try again later.');
      } else if (error.message.includes('Invalid location') || error.message.includes('400')) {
        throw new Error('Please check your departure and destination cities. Use city names or airport codes (e.g., "New York" or "JFK").');
      } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
        throw new Error('Too many searches. Please wait a moment before searching again.');
      } else {
        throw new Error(error.message || 'Flight search failed. Please try again.');
      }
    }
  }

  // Get popular destinations for suggestions
  getPopularDestinations() {
    return popularDestinations;
  }

  // Search destinations (for autocomplete)
  async searchDestinations(origin, maxPrice = null) {
    try {
      if (!origin || origin.length < 2) {
        return this.getPopularDestinations();
      }

      const destinations = await amadeusAPI.searchDestinations(origin, maxPrice);
      
      // If no results from API, return popular destinations
      if (!destinations || destinations.length === 0) {
        return this.getPopularDestinations().filter(dest => 
          dest.city.toLowerCase() !== origin.toLowerCase() &&
          dest.iata.toLowerCase() !== origin.toLowerCase()
        );
      }

      return destinations;
    } catch (error) {
      console.warn('Destination search failed, returning popular destinations:', error);
      return this.getPopularDestinations();
    }
  }

  // Validate IATA code format
  isValidIATACode(code) {
    return /^[A-Z]{3}$/.test(code);
  }

  // Format location input (cleanup user input)
  formatLocationInput(input) {
    if (!input) return '';
    
    // Just remove extra spaces, don't change capitalization
    return input.trim();
  }
}

// Export singleton instance
export const flightSearchService = new FlightSearchService();
export default flightSearchService;