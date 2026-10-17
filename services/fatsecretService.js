const axios = require('axios');

let cachedToken = null;
let tokenExpiryTime = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTime) {
    return cachedToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('FatSecret client credentials are not configured');
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      'grant_type=client_credentials&scope=basic',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiryTime = now + (response.data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.error('Error fetching FatSecret Access Token:', error.response?.data || error.message);
    throw new Error('ไม่สามารถรับ Access Token จาก FatSecret ได้');
  }
}

async function searchFoodFromFatSecret(foodName) {
  if (!foodName || typeof foodName !== 'string') {
    return [];
  }

  try {
    const token = await getAccessToken();

    const response = await axios.get('https://platform.fatsecret.com/rest/server.api', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        method: 'foods.search',
        search_expression: foodName,
        format: 'json',
      },
    });

    return response.data.foods?.food || [];
  } catch (error) {
    console.error('Error searching food on FatSecret:', error.response?.data || error.message);
    return [];
  }
}

module.exports = {
  searchFoodFromFatSecret,
};
