import http from 'k6/http';
import { check, sleep } from 'k6';
import {htmlReport} from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export const options = {
  vus: 20,          // 20 virtual users
  duration: '50s',  // Run for 50 seconds
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be under 1%
  },
};

export default function () {
  const res = http.get('https://www.commbank.com.au/personal-loans.html');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
  };
}
