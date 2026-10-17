import { MONGODB_DATA_API_ENDPOINT, MONGODB_DATA_API_KEY, MONGODB_DATA_API_DATABASE, MONGODB_DATA_API_COLLECTION, MONGODB_DATA_SOURCE } from '../config';

function isMongoConfigured() {
  return Boolean(
    MONGODB_DATA_API_ENDPOINT &&
      MONGODB_DATA_API_ENDPOINT !== 'YOUR_MONGODB_DATA_API_ENDPOINT' &&
      MONGODB_DATA_API_KEY &&
      MONGODB_DATA_API_KEY !== 'YOUR_MONGODB_DATA_API_KEY'
  );
}

async function requestMongo(action, body = {}) {
  if (!isMongoConfigured()) {
    throw new Error('MongoDB Atlas Data API is not configured');
  }

  const response = await fetch(`${MONGODB_DATA_API_ENDPOINT}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_DATA_API_KEY,
    },
    body: JSON.stringify({
      database: MONGODB_DATA_API_DATABASE,
      collection: MONGODB_DATA_API_COLLECTION,
      dataSource: MONGODB_DATA_SOURCE,
      ...body,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'MongoDB request failed');
  }

  return payload;
}

export async function findUserByEmail(email) {
  const payload = await requestMongo('findOne', {
    filter: { email: email.toLowerCase() },
  });
  return payload.document || null;
}

export async function createUser(userDocument) {
  const payload = await requestMongo('insertOne', {
    document: userDocument,
  });

  return {
    ...userDocument,
    _id: payload.insertedId,
  };
}
