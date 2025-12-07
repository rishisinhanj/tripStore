// Amadeus Flight API Service
class AmadeusAPI {
  constructor() {
    this.apiKey = process.env.REACT_APP_AMADEUS_API_KEY;
    this.apiSecret = process.env.REACT_APP_AMADEUS_API_SECRET;
    this.baseUrl = process.env.REACT_APP_AMADEUS_BASE_URL;
    this.accessToken = null;
    this.tokenExpiry = null;

    // Check if environment variables are loaded
    if (!this.apiKey || !this.apiSecret || !this.baseUrl) {
      console.error('Missing Amadeus API credentials:', {
        hasApiKey: !!this.apiKey,
        hasApiSecret: !!this.apiSecret,
        hasBaseUrl: !!this.baseUrl,
      });
      throw new Error(
        'Amadeus API credentials not found. Please check your .env file.'
      );
    }

    console.log('Amadeus API initialized with base URL:', this.baseUrl);
  }

  // Get OAuth access token from Amadeus
  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Authentication failed: ${
            errorData.error_description || response.statusText
          }`
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Set expiry to 30 minutes from now (Amadeus tokens typically last 30 minutes)
      this.tokenExpiry = Date.now() + (data.expires_in || 1799) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Amadeus access token:', error);
      throw new Error(
        'Unable to authenticate with flight API: ' + error.message
      );
    }
  }

  // Make authenticated API requests
  async makeAPIRequest(endpoint, params = {}) {
    const token = await this.getAccessToken();

    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ''
      ) {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log('Making API request to:', url.toString());

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          console.error('Parsed error data:', errorData);

          // Handle Amadeus-specific error format
          if (errorData.errors && errorData.errors.length > 0) {
            const firstError = errorData.errors[0];
            throw new Error(
              `API Error: ${
                firstError.detail || firstError.title || response.statusText
              }`
            );
          }

          throw new Error(
            `API Error: ${
              errorData.error_description ||
              errorData.detail ||
              response.statusText
            }`
          );
        } catch (parseError) {
          throw new Error(
            `API Error: ${response.status} - ${
              errorText || response.statusText
            }`
          );
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Amadeus API request failed:', error);
      throw error;
    }
  }

  // Convert airport input to IATA code
  async getIATACode(location) {
    // Clean up the input
    const cleanLocation = location.trim().toUpperCase();

    // Check if it's already a valid 3-letter IATA code
    if (cleanLocation.length === 3 && /^[A-Z]{3}$/.test(cleanLocation)) {
      console.log(`Using IATA code: ${cleanLocation}`);
      return cleanLocation;
    }

    // If not a 3-letter code, throw a helpful error
    throw new Error(
      `Please enter a valid 3-letter airport code (e.g., EWR, NRT, LAX). "${location}" is not a valid IATA code.`
    );
  }

  // Search flight offers
  async searchFlightOffers({
    from,
    to,
    departDate,
    returnDate,
    passengers = 1,
    maxResults = 10,
  }) {
    try {
      // Validate required parameters
      if (!from || !to || !departDate) {
        throw new Error('From, To, and Departure Date are required');
      }

      // Validate date format (should be YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(departDate)) {
        throw new Error('Departure date must be in YYYY-MM-DD format');
      }

      if (returnDate && !dateRegex.test(returnDate)) {
        throw new Error('Return date must be in YYYY-MM-DD format');
      }

      // Check if dates are in the future
      const today = new Date().toISOString().split('T')[0];
      if (departDate < today) {
        throw new Error('Departure date must be in the future');
      }

      if (returnDate && returnDate <= departDate) {
        throw new Error('Return date must be after departure date');
      }

      console.log('Searching flights with original params:', {
        from,
        to,
        departDate,
        returnDate,
        passengers,
      });

      // Convert locations to IATA codes
      const originCode = await this.getIATACode(from);
      const destinationCode = await this.getIATACode(to);

      console.log('Converted IATA codes:', {
        origin: originCode,
        destination: destinationCode,
      });

      // Build search parameters
      const searchParams = {
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate: departDate,
        adults: passengers.toString(),
        max: Math.min(maxResults, 100).toString(),
        currencyCode: 'USD',
      };

      // Add return date if provided
      if (returnDate) {
        searchParams.returnDate = returnDate;
      }

      console.log('Final API search params:', searchParams);

      // Make the flight offers search request
      const data = await this.makeAPIRequest(
        '/v2/shopping/flight-offers',
        searchParams
      );

      return this.formatFlightResults(data, {
        from,
        to,
        departDate,
        returnDate,
        passengers,
      });
    } catch (error) {
      console.error('Flight search failed:', error);
      throw new Error('Flight search failed: ' + error.message);
    }
  }

  // Format Amadeus API response to our frontend format
  // Format Amadeus API response to our frontend format
  formatFlightResults(apiResponse, searchParams) {
    if (!apiResponse.data || apiResponse.data.length === 0) {
      return {
        outbound: [],
        return: [],
        searchParams,
        totalResults: 0,
      };
    }

    const outbound = [];
    const returnFlights = [];

    apiResponse.data.forEach((offer) => {
      const itineraries = offer.itineraries || [];
      if (itineraries.length === 0) return;

      // Always create an outbound flight from the first itinerary
      outbound.push(
        this.formatSingleFlight(
          offer,
          apiResponse.dictionaries,
          0, // itineraryIndex
          'outbound' // direction
        )
      );

      // If this is a round trip and we have a second itinerary, create a return flight
      if (searchParams.returnDate && itineraries.length > 1) {
        returnFlights.push(
          this.formatSingleFlight(
            offer,
            apiResponse.dictionaries,
            1, // second itinerary
            'return' // direction
          )
        );
      }
    });

    const hasReturn = searchParams.returnDate;

    return {
      outbound,
      return: hasReturn ? returnFlights : [],
      searchParams,
      // totalResults = number of individual flights we’re showing
      totalResults: outbound.length + (hasReturn ? returnFlights.length : 0),
    };
  }

  // Format a single flight offer
  // Format a single flight offer / itinerary
  formatSingleFlight(
    offer,
    dictionaries,
    itineraryIndex = 0,
    direction = 'outbound'
  ) {
    const itineraries = offer.itineraries || [];
    const itinerary = itineraries[itineraryIndex] || itineraries[0];

    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];

    // Get airline name from dictionaries
    const carrierCode = firstSegment.carrierCode;
    const airlineName = dictionaries?.carriers?.[carrierCode] || carrierCode;

    // Calculate total duration for this itinerary
    const totalDuration = this.parseDuration(itinerary.duration);

    // Split price across itineraries (so outbound/return don’t both show full trip price)
    const totalTripPrice =
      offer.price && offer.price.total ? parseFloat(offer.price.total) : 0;
    const perItineraryPrice =
      itineraries.length > 0
        ? totalTripPrice / itineraries.length
        : totalTripPrice;

    return {
      // Make the id unique per direction so React + saving logic are happy
      id: `${offer.id || Math.random().toString(36).substr(2, 9)}-${direction}`,
      airline: airlineName,
      flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
      departure: {
        airport: firstSegment.departure.iataCode,
        city: this.getLocationName(
          firstSegment.departure.iataCode,
          dictionaries
        ),
        time: this.formatTime(firstSegment.departure.at),
        date: this.formatDate(firstSegment.departure.at),
      },
      arrival: {
        airport: lastSegment.arrival.iataCode,
        city: this.getLocationName(lastSegment.arrival.iataCode, dictionaries),
        time: this.formatTime(lastSegment.arrival.at),
        date: this.formatDate(lastSegment.arrival.at),
      },
      price: perItineraryPrice,
      duration: totalDuration,
      class: this.getTravelClass(
        offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.class
      ),
      stops: itinerary.segments.length - 1,
      direction,
    };
  }

  // Helper methods
  parseDuration(duration) {
    // Parse ISO 8601 duration format (PT4H30M)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      return `${hours}h ${minutes}m`;
    }
    return duration;
  }

  formatTime(datetime) {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  formatDate(datetime) {
    return new Date(datetime).toISOString().split('T')[0];
  }

  getLocationName(iataCode, dictionaries) {
    return dictionaries?.locations?.[iataCode]?.cityCode || iataCode;
  }

  getTravelClass(classCode) {
    const classMap = {
      Y: 'Economy',
      W: 'Premium Economy',
      C: 'Business',
      F: 'First Class',
    };
    return classMap[classCode] || 'Economy';
  }

  // Search flight destinations (for suggestions)
  async searchDestinations(origin, maxPrice) {
    try {
      const originCode = await this.getIATACode(origin);

      const params = {
        origin: originCode,
      };

      if (maxPrice) {
        params.maxPrice = maxPrice;
      }

      const data = await this.makeAPIRequest(
        '/v1/shopping/flight-destinations',
        params
      );

      return (
        data.data?.map((dest) => ({
          destination: dest.destination,
          price: dest.price?.total,
          departureDate: dest.departureDate,
          returnDate: dest.returnDate,
        })) || []
      );
    } catch (error) {
      console.error('Destination search failed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const amadeusAPI = new AmadeusAPI();
export default amadeusAPI;
