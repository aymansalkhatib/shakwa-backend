import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration - 1 minute load test
export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up to 50 users
    { duration: '20s', target: 100 }, // Ramp up to 100 users
    { duration: '20s', target: 100 }, // Stay at 100 users
    { duration: '10s', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    errors: ['rate<0.1'], // Custom error rate under 10%
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

// ============================================
// PASTE YOUR TOKEN HERE
// ============================================
// To get a token:
// 1. Login via Postman using POST /api/auth/citizens/login
// 2. Copy the accessToken from the response
// 3. Paste it below (replace 'PASTE_YOUR_TOKEN_HERE')
const CITIZEN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJjaXRpemVuIiwiaWF0IjoxNzY3MjY3NTQyLCJleHAiOjE3Njg1NjM1NDJ9.0lqGuaB5G1dObhnedEalUayWWNWf3TCe4838j1u-sfs';

// Helper function to generate random complaint data
function generateComplaintData() {
  const categories = [
    'general_service',
    'infrastructure',
    'healthcare',
    'education',
    'security',
    'environment',
    'billing_and_fees',
    'staff_behavior',
    'corruption',
    'other',
  ];

  const authorities = [
    'municipality',
    'electricity_company',
    'water_company',
    'telecom_company',
    'internet_provider',
    'ministry_of_health',
    'public_hospital',
    'ministry_of_education',
    'public_school',
    'public_university',
    'traffic_police',
    'public_transport_authority',
    'social_affairs_ministry',
    'consumer_protection',
    'tax_authority',
    'passports_and_immigration',
    'civil_registry',
    'ministry_of_interior',
    'environment_department',
    'other_government_entity',
  ];

  const titles = [
    'Street Light Not Working',
    'Pothole on Main Street',
    'Garbage Collection Issue',
    'Water Supply Problem',
    'Noise Complaint',
    'Electricity Outage',
    'Road Damage',
    'Hospital Service Issue',
  ];

  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    description: `Load test complaint from VU ${__VU} at ${new Date().toISOString()}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    authority: authorities[Math.floor(Math.random() * authorities.length)],
    location: `Test Location ${__VU}`,
    citizenNote: 'This is a test complaint created during load testing',
  };
}

// Main test flow - citizen your-bucket-name
function testComplaintsEndpoint(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Test 1: Get all my your-bucket-name (main endpoint)
  let res = http.get(`${BASE_URL}/citizen/your-bucket-name?page=1&limit=10`, { headers });
  check(res, {
    'get your-bucket-name status 200': (r) => r.status === 200,
    'get your-bucket-name has data': (r) => r.json('data') !== undefined,
  }) || errorRate.add(1);
  sleep(0.5);

  // Test 2: Get your-bucket-name with filters
  res = http.get(`${BASE_URL}/citizen/your-bucket-name?page=1&limit=20&status=new`, { headers });
  const filterSuccess = check(res, {
    'get filtered your-bucket-name status 200': (r) => r.status === 200,
  });
  if (!filterSuccess) {
    console.error(`Filter request failed with status ${res.status}: ${res.body}`);
    errorRate.add(1);
  }
  sleep(0.5);

  // Test 3: Create a complaint
  const complaintData = generateComplaintData();
  res = http.post(`${BASE_URL}/citizen/your-bucket-name`, JSON.stringify(complaintData), { headers });
  const complaintCreated = check(res, {
    'create complaint status 201': (r) => r.status === 201,
  });
  if (!complaintCreated) {
    console.error(`Create complaint failed with status ${res.status}: ${res.body}`);
    errorRate.add(1);
  }

  let complaintId;
  if (complaintCreated && res.json()) {
    complaintId = res.json('id');
  }
  sleep(0.5);

  // Test 4: Get specific complaint
  if (complaintId) {
    res = http.get(`${BASE_URL}/citizen/your-bucket-name/${complaintId}`, { headers });
    check(res, {
      'get complaint by id status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    sleep(0.5);

    // Test 5: Update complaint
    const updateData = {
      description: `Updated by load test VU ${__VU}`,
    };
    res = http.patch(
      `${BASE_URL}/citizen/your-bucket-name/${complaintId}`,
      JSON.stringify(updateData),
      { headers },
    );
    check(res, {
      'update complaint status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
}

// Main test scenario
export default function () {
  // Validate token is set
  if (CITIZEN_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
    console.error('ERROR: Please paste your citizen token in the script!');
    errorRate.add(1);
    return;
  }

  // Run the your-bucket-name endpoint tests
  testComplaintsEndpoint(CITIZEN_TOKEN);
  sleep(1);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('===========================================');
  console.log('Citizen Complaints Load Test');
  console.log('===========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Duration: 1 minute`);
  console.log(`Max Users: 100 concurrent`);
  console.log('');

  // Validate token
  if (CITIZEN_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
    throw new Error('Please paste your citizen token in the script before running!');
  }

  // Test if API is reachable
  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    throw new Error(`API is not reachable. Health check returned status ${res.status}`);
  }

  console.log('✓ API is reachable');
  console.log('✓ Token is set');
  console.log('');
  console.log('Starting test...');
  console.log('===========================================');
}

// Teardown function (runs once at the end)
export function teardown() {
  console.log('');
  console.log('===========================================');
  console.log('Load test completed!');
  console.log('===========================================');
}
