import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  deleteDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';

export const tripService = {
  // Test Firestore connection with detailed logging
  async testConnection() {
    try {
      console.log('🔧 Testing Firestore connection...');
      console.log('🔧 Database instance:', db);
      console.log('🔧 App config:', db.app.options);
      
      // Check authentication state
      const auth = getAuth();
      console.log('🔐 Auth state:', {
        currentUser: auth.currentUser?.uid || 'none',
        email: auth.currentUser?.email || 'none',
        isSignedIn: !!auth.currentUser,
        authDomain: auth.app?.options?.authDomain
      });
      
      if (!auth.currentUser) {
        console.warn('⚠️ No authenticated user - this might cause permission issues');
      }
      
      // Test basic collection access
      const testCollection = collection(db, 'trips');
      console.log('🔧 Collection reference created:', testCollection);
      
      // Try a simple query
      const testQuery = query(testCollection, where('__name__', '==', 'nonexistent'));
      console.log('🔧 Query created, attempting to fetch...');
      
      // Add timeout to catch hanging queries
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });
      
      console.log('⏳ Starting getDocs with 10s timeout...');
      const snapshot = await Promise.race([
        getDocs(testQuery),
        timeoutPromise
      ]);
      
      console.log('✅ Firestore connection successful!');
      console.log('📊 Query result - documents:', snapshot.size);
      console.log('📊 Query metadata:', snapshot.metadata);
      console.log('📊 From cache:', snapshot.metadata?.fromCache);
      console.log('📊 Has pending writes:', snapshot.metadata?.hasPendingWrites);
      console.log('📊 Is from server:', !snapshot.metadata?.fromCache);
      
      return true;
    } catch (error) {
      console.error('❌ Firestore connection failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      throw new Error('Database connection failed: ' + error.message);
    }
  },

  // Add a flight to stored trips
  async saveFlight(userId, flightData, searchParams = null) {
    try {
      const tripData = {
        userId,
        type: 'flight',
        tripName: `${flightData.departure.city} to ${flightData.arrival.city}`,
        flight: flightData,
        searchParams: searchParams, // Store search params separately
        totalCost: flightData.price * (searchParams?.passengers || 1),
        passengers: searchParams?.passengers || 1,
        status: 'saved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'trips'), tripData);
      return { id: docRef.id, ...tripData };
    } catch (error) {
      throw new Error('Failed to save flight: ' + error.message);
    }
  },

  // Create a custom vacation/trip
  async createCustomTrip(userId, tripData) {
    try {
      // Check authentication before attempting write
      const auth = getAuth();
      console.log('🔐 Auth check before creating vacation:', {
        currentUser: auth.currentUser?.uid || 'none',
        email: auth.currentUser?.email || 'none',
        providedUserId: userId,
        userMatch: auth.currentUser?.uid === userId
      });
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated - cannot create vacation');
      }
      
      if (auth.currentUser.uid !== userId) {
        throw new Error('User ID mismatch - security violation');
      }
      
      const customTrip = {
        userId,
        type: 'vacation',
        tripName: tripData.tripName,
        destination: tripData.destination,
        startDate: tripData.startDate, // Keep as string for now
        endDate: tripData.endDate, // Keep as string for now
        passengers: tripData.passengers || 1,
        budget: tripData.budget || 0,
        notes: tripData.notes || '',
        status: 'planning',
        activities: tripData.activities || [],
        accommodation: tripData.accommodation || '',
        flights: [], // Initialize empty flights array
        createdAt: new Date().toISOString(), // Use regular timestamp instead of serverTimestamp()
        updatedAt: new Date().toISOString()   // Use regular timestamp instead of serverTimestamp()
      };

      console.log('Creating vacation with data:', customTrip);
      
      // Add timeout for the write operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Create vacation timeout after 10 seconds')), 10000);
      });
      
      console.log('⏳ Starting addDoc operation with 10s timeout...');
      const startTime = Date.now();
      
      const docRef = await Promise.race([
        addDoc(collection(db, 'trips'), customTrip),
        timeoutPromise
      ]);
      
      const endTime = Date.now();
      console.log(`✅ Vacation created successfully in ${endTime - startTime}ms`);
      console.log('✅ Document ID:', docRef.id);
      
      return { id: docRef.id, ...customTrip };
    } catch (error) {
      console.error('❌ Error creating vacation:');
      console.error('Error type:', typeof error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      throw new Error('Failed to create vacation: ' + error.message);
    }
  },

  // Add flight to existing vacation
  async addFlightToVacation(vacationId, flightData) {
    try {
      const flightToAdd = {
        ...flightData,
        addedAt: new Date()
      };

      // Get current vacation document first
      const vacationRef = doc(db, 'trips', vacationId);
      const vacationDoc = await getDoc(vacationRef);
      
      let currentFlights = [];
      if (vacationDoc.exists()) {
        const vacation = vacationDoc.data();
        currentFlights = vacation.flights || [];
      }

      await updateDoc(vacationRef, {
        flights: [...currentFlights, flightToAdd],
        updatedAt: serverTimestamp()
      });

      return flightToAdd;
    } catch (error) {
      console.error('Error adding flight to vacation:', error);
      throw new Error('Failed to add flight to vacation: ' + error.message);
    }
  },

  // Get all trips for a user
  async getUserTrips(userId) {
    try {
      console.log('🔍 Fetching trips for user:', userId);
      
      if (!userId) {
        console.warn('⚠️ No userId provided');
        return [];
      }
      
      // Debug the collection and query setup
      const tripsCollection = collection(db, 'trips');
      console.log('📁 Collection reference:', tripsCollection);
      
      const q = query(tripsCollection, where('userId', '==', userId));
      console.log('🔍 Query created:', q);
      console.log('🔍 Querying for userId:', userId);
      
      console.log('⏳ Starting query execution...');
      const startTime = Date.now();
      
      const querySnapshot = await getDocs(q);
      
      const endTime = Date.now();
      console.log(`✅ Query completed in ${endTime - startTime}ms`);
      console.log('📊 Query snapshot:', querySnapshot);
      console.log('📊 Documents found:', querySnapshot.size);
      console.log('📊 Empty result:', querySnapshot.empty);
      console.log('📊 Metadata:', querySnapshot.metadata);
      
      if (querySnapshot.empty) {
        console.log('📭 No trips found for user');
        return [];
      }
      
      console.log('🔄 Processing documents...');
      const trips = [];
      querySnapshot.docs.forEach((doc, index) => {
        console.log(`📄 Document ${index + 1}:`, {
          id: doc.id,
          exists: doc.exists(),
          data: doc.data()
        });
        
        const data = doc.data();
        trips.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log('✅ Processed trips:', trips.length);
      console.log('📋 Final trips array:', trips);
      return trips;
      
    } catch (error) {
      console.error('❌ Error fetching trips:');
      console.error('Error type:', typeof error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      throw new Error('Failed to fetch trips: ' + error.message);
    }
  },

  // Get only vacations (not individual flights)
  async getUserVacations(userId) {
    try {
      console.log('🔍 Fetching vacations for user:', userId);
      
      if (!userId) {
        console.warn('⚠️ No userId provided for vacations');
        return [];
      }
      
      // Debug the collection and query setup
      const tripsCollection = collection(db, 'trips');
      console.log('📁 Vacations collection reference:', tripsCollection);
      
      const q = query(
        tripsCollection,
        where('userId', '==', userId),
        where('type', '==', 'vacation')
      );
      console.log('🔍 Vacation query created:', q);
      console.log('🔍 Querying for userId:', userId, 'and type: vacation');
      
      console.log('⏳ Starting vacation query execution...');
      const startTime = Date.now();
      
      const querySnapshot = await getDocs(q);
      
      const endTime = Date.now();
      console.log(`✅ Vacation query completed in ${endTime - startTime}ms`);
      console.log('📊 Vacation query snapshot:', querySnapshot);
      console.log('📊 Vacation documents found:', querySnapshot.size);
      console.log('📊 Vacation empty result:', querySnapshot.empty);
      console.log('📊 Vacation metadata:', querySnapshot.metadata);
      
      if (querySnapshot.empty) {
        console.log('📭 No vacations found for user');
        return [];
      }
      
      console.log('🔄 Processing vacation documents...');
      const vacations = [];
      querySnapshot.docs.forEach((doc, index) => {
        console.log(`📄 Vacation document ${index + 1}:`, {
          id: doc.id,
          exists: doc.exists(),
          data: doc.data()
        });
        
        const data = doc.data();
        vacations.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log('✅ Processed vacations:', vacations.length);
      console.log('📋 Final vacations array:', vacations);
      return vacations;
      
    } catch (error) {
      console.error('❌ Error fetching vacations:');
      console.error('Error type:', typeof error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      throw new Error('Failed to fetch vacations: ' + error.message);
    }
  },

  // Delete a trip
  async deleteTrip(tripId) {
    try {
      await deleteDoc(doc(db, 'trips', tripId));
    } catch (error) {
      throw new Error('Failed to delete trip: ' + error.message);
    }
  },

  // Update a trip
  async updateTrip(tripId, updates) {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to update trip: ' + error.message);
    }
  }
};