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