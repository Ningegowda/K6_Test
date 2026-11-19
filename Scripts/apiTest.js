import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configure load stages and pass/fail thresholds
export const options = {
  stages: [
    { duration: '20s', target: 15 }, // Ramp up to 15 concurrent users
    { duration: '1m', target: 15 },  // Hold steady load for 1 minute
    { duration: '15s', target: 0 },  // Ramp down gracefully
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must finish under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failed requests allowed
    checks: ['rate>0.99'],            // 99% of checks must pass
  },
};

const BASE_URL = 'https://jsonplaceholder.typicode.com/'; // Replace with your actual API base URL

// 2. Setup runs ONCE before the test starts (ideal for fetching an auth token)
export function setup() {
  const loginPayload = JSON.stringify({
    username: 'standard_user',
    password: 'secret_sauce',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const loginRes = http.post(`${BASE_URL}/posts`, params);

  if (loginRes.status !== 201) {
    throw new Error(`Login failed with status ${loginRes.status}: ${loginRes.body}`);
  }

  return { token: loginRes.json('token') }; // Adjust 'token' to match your JSON key
}

// 3. Default runs repeatedly for every Virtual User (VU)
export default function (data) {
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      //Authorization: `Bearer ${data.token}`,
    },
  };

  // Example A: Authenticated GET request
  const getRes = http.get(`${BASE_URL}/posts`, authHeaders);
  check(getRes, {
    'GET status is 200': (r) => r.status === 200,
      'GET returns valid JSON': (r) => {
      if (r.status !== 200) return false;
        try {
          return Array.isArray(r.json());
        } catch (e) {
          return false;
        }
      },
  });

  sleep(1);

  // Example B: Authenticated POST request with dynamic data
  const postPayload = JSON.stringify({
    title: `Post-${__VU}-${__ITER}`, // Unique title per user and iteration
    body: 'This is a sample post body.',
    userId: 1,
  });

  const postRes = http.post(`${BASE_URL}/posts`, postPayload, authHeaders);
  check(postRes, {
    'POST status is 201': (r) => r.status === 201,
  });

  sleep(1);
}
