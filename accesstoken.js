const axios = require("axios").default;
const fs = require('fs');
const qs = require('qs');

async function getAccessToken(refreshToken) {
  try {
    const response = await axios.post('https://sales2-dev-com-sap-rex-app.cfapps.eu30.hana.ondemand.com/oauth2/api/v1/token', qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '55c33c58-c72f-438b-a771-42efbbac82f0',  // Replace with your client ID
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Log the new access token to a file
    fs.writeFileSync('access_token.txt', response.data.access_token);
    console.log("Access token retrieved and saved to access_token.txt");
    
    return response.data.access_token; // Adjust based on your response structure
  } catch (error) {
    console.error("Error refreshing access token:", error.message);
    throw error;
  }
}

// Replace with your actual refresh token
const refreshToken = '4e6f04ccef664330b666a657deb4a362-r'; 

getAccessToken(refreshToken)
  .then(token => {
    console.log("Access Token:", token);
  })
  .catch(error => {
    console.error("Failed to retrieve access token:", error);
  });
