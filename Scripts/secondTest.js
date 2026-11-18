import http from 'k6/http';
import { check, sleep } from 'k6';
import {htmlReport} from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
export const options = {
  // Simulate a realistic traffic spike
  stages: [
    { duration: '15s', target: 10 }, // Ramp up to 10 users over 15s
    { duration: '30s', target: 10 }, // Stay at 10 users for 30s
    { duration: '15s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% of requests must finish under 400ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors allowed
    checks: ['rate>0.99'],            // 99% of checks must pass
  },
};

export default function () {
  const res = http.get('https://k6.io');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has data': (r) => {
      if (r.status !== 200) return false;
      try {
        const data = r.json();
        return Array.isArray(data) && data.length > 0;
      } catch (e) {
        return false;
      }
    },
    'fast response (<200ms)': (r) => r.timings.duration < 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
  };
}
