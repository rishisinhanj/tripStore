## TRIPSTORE 

1. Create a react based app that can manage users flights 

In the first page, have a login page with either firebase. The name should be tripStore. We can have a login and signup page 

* If there are too many requests, send a 429 rate limiting code 
* Authentication should always be performed on the client side before content on the page is
loaded/lazy loading the content or before making an API call. Cases include:
● A token is not available in the session or local storage, or the authentication provider fails.
● An API has returned a 401 or 403 status code.
Avoid making the API call if you already know that the user is not authenticated/authorized.
Redirect the user away from the page if not authenticated, or show an appropriate message.


2. For users, they should have a database that keeps track of their stored trips and also enables them to search for flights. They can route based off different buttons. In the search flights, we can route to a page that allows people to search for flights based off different information

3. For stored flights, it should go to a database of these stored vacations

when users click the button on the dashboard for stored flights, they have the option to add it to their flight stored database with a dropdown of all the flights 

From the dashboard, when they click the stored vacations, it shows the trips organized in chronological order with their price displayed as well. When you click on a vacation, it shows each flight that has been added there. 

for the airport, stick to using iata codes


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
   - Edit `.env` with your Firebase credentials:
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
