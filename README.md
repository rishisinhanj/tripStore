## TRIPSTORE 

Searching for flights on the internet is easy, but
being able to store flights of interest and manage distinct trips is still a need we have not found
a solution for. To that end, we propose our app TripStore. This solution will allow individuals to
keep tabs on distinct vacations they could be interested in, search for existing flights and get information on their upcoming destinations.

#### Login


Users can either login or signup for a new account to get access for our service. When they login, there will be a dashboard with the options to search for new flights or look at saved trips. 

#### 1. Searching for flights 

Users have to type the 3 letter IATA code for the origin airport and the destination airport. For a one-way flight, a return destination does not have to be specified. Otherwise, both the origin and return should be filled. We then make a call using the Amadeus Travel API to return up-to-date flights that fulfill the criteria. Users can save these flights to eventually add them to a trip. If it is a round trip, *users must add both the outbound and return flight*. 

#### 2. Saved trips 

Users can access their saved trips to look at saved flights as well as saved vacations. Anytime a user adds a flight from our search feature, it shows up in the saved flights. Users can add descriptions and features about their vacation and then add these flights to their saved vacation. If a flight is within 5 days, users can also get weather information that we make by calling a local API. Users can see the total flight costs that have been added to a vacation.


#### 3. Changing Profile Details

A user can also change their password by clicking the changing profile details to change their password.



## Steps for local installation 

1. Clone repository 

    ```bash
    git clone https://github.com/rishisinhanj/tripStore.git
    ```


2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` with correct Firebase credentials, use of Amodeus API key, and Weather API: OpenWeather:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```




## Development

We used Firebase for authentication so that users can log in and change their password. As a result, they also can see only their specific trips and no one else's.

In addition, we used the Amadeus Travel API to search for flights using IATA codes, and provide up-to-date flight information. OpenWeather was utilized for providing weather information on nearby flights, and we used React for developing the web app.
