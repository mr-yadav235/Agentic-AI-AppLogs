const client = require('../services/elastic');
require('dotenv').config();

// Sample services and their typical operations
const services = [
  'auth-service',
  'payment-service', 
  'user-service',
  'notification-service',
  'api-gateway',
  'database-service',
  'cache-service',
  'file-service',
  'analytics-service',
  'order-service'
];

const logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

// Message templates for different services and levels
const messageTemplates = {
  'auth-service': {
    'ERROR': [
      'Failed to validate user token: Invalid signature',
      'Login failed: User not found in database',
      'Authentication timeout: Session expired after 30 minutes',
      'Password reset failed: Email address not registered',
      'Two-factor authentication failed: Invalid code provided',
      'Account locked: Too many failed login attempts',
      'JWT token validation failed: Token expired',
      'OAuth callback error: Invalid state parameter'
    ],
    'WARN': [
      'Multiple login attempts detected from IP: {}',
      'Password will expire in 7 days for user: {}',
      'Unusual login location detected: {}',
      'Rate limiting applied: Too many requests from IP {}',
      'Weak password detected during password change'
    ],
    'INFO': [
      'User logged in successfully: {}',
      'Password changed successfully for user: {}',
      'New user registration completed: {}',
      'Two-factor authentication enabled for user: {}',
      'User logged out successfully: {}',
      'Password reset email sent to: {}'
    ],
    'DEBUG': [
      'Validating JWT token for user: {}',
      'Checking user permissions for resource: {}',
      'Generating new access token',
      'Refreshing user session data'
    ]
  },
  'payment-service': {
    'ERROR': [
      'Payment processing failed: Insufficient funds',
      'Credit card validation failed: Invalid card number',
      'Payment gateway timeout: Connection lost',
      'Refund processing failed: Transaction not found',
      'Currency conversion failed: Invalid currency code',
      'Payment declined by bank: Risk assessment failed',
      'Recurring payment failed: Card expired',
      'Webhook validation failed: Invalid signature'
    ],
    'WARN': [
      'High transaction amount detected: ${}',
      'Multiple failed payment attempts for order: {}',
      'Payment processing taking longer than expected',
      'Unusual spending pattern detected for user: {}'
    ],
    'INFO': [
      'Payment processed successfully: ${} for order {}',
      'Refund issued successfully: ${} for transaction {}',
      'New payment method added for user: {}',
      'Recurring payment setup completed for user: {}',
      'Payment notification sent to user: {}'
    ],
    'DEBUG': [
      'Validating payment details for order: {}',
      'Calculating tax for transaction: {}',
      'Processing payment for amount: ${}',
      'Updating payment status in database'
    ]
  },
  'user-service': {
    'ERROR': [
      'Failed to create user profile: Email already exists',
      'User profile update failed: Invalid data format',
      'Email verification failed: Token expired',
      'Account deletion failed: Active subscriptions exist',
      'Profile image upload failed: File too large',
      'User preferences sync failed: Database connection error'
    ],
    'WARN': [
      'User profile incomplete: Missing required fields',
      'Large profile image uploaded by user: {}',
      'User attempting to delete account with active orders',
      'Multiple profile update attempts detected'
    ],
    'INFO': [
      'User profile created successfully: {}',
      'User profile updated: {}',
      'Email verification completed for user: {}',
      'User preferences saved successfully',
      'Profile image uploaded successfully for user: {}'
    ],
    'DEBUG': [
      'Fetching user profile data for: {}',
      'Validating user profile information',
      'Syncing user preferences with cache',
      'Generating user profile summary'
    ]
  },
  'notification-service': {
    'ERROR': [
      'Email delivery failed: SMTP server unreachable',
      'SMS delivery failed: Invalid phone number',
      'Push notification failed: Device token invalid',
      'Newsletter subscription failed: Email bounced',
      'Template rendering failed: Missing variables',
      'Notification queue processing failed: Memory limit exceeded'
    ],
    'WARN': [
      'Email delivery delayed: High queue volume',
      'SMS rate limit reached for user: {}',
      'Push notification device limit exceeded',
      'Unsubscribe rate high for campaign: {}'
    ],
    'INFO': [
      'Email sent successfully to: {}',
      'SMS delivered to: {}',
      'Push notification sent to device: {}',
      'Email subscription confirmed for: {}',
      'Notification preferences updated for user: {}'
    ],
    'DEBUG': [
      'Processing notification queue: {} items',
      'Rendering email template for user: {}',
      'Checking notification preferences for user: {}',
      'Queuing push notification for delivery'
    ]
  },
  'api-gateway': {
    'ERROR': [
      'Service unavailable: Backend service not responding',
      'Rate limit exceeded: 1000 requests per minute',
      'Authentication failed: Invalid API key',
      'Request validation failed: Missing required parameters',
      'Circuit breaker opened: Too many failures',
      'Load balancer error: No healthy instances available'
    ],
    'WARN': [
      'High response time detected: {}ms for endpoint {}',
      'API key nearing rate limit: {}',
      'Unusual traffic pattern detected from IP: {}',
      'Backend service responding slowly: {}'
    ],
    'INFO': [
      'API request processed successfully: {} {}',
      'New API key generated for client: {}',
      'Circuit breaker reset: Service healthy',
      'Rate limit reset for client: {}'
    ],
    'DEBUG': [
      'Routing request to backend service: {}',
      'Validating API request parameters',
      'Applying rate limiting for client: {}',
      'Load balancing request to instance: {}'
    ]
  }
};

// Generate random data helpers
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomTimestamp() {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * 30); // Last 30 days
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  const randomSeconds = Math.floor(Math.random() * 60);
  
  const timestamp = new Date(now);
  timestamp.setDate(timestamp.getDate() - randomDays);
  timestamp.setHours(randomHours, randomMinutes, randomSeconds);
  
  return timestamp.toISOString();
}

function generateUserId() {
  return `user_${Math.floor(Math.random() * 10000)}`;
}

function generateOrderId() {
  return `order_${Math.floor(Math.random() * 100000)}`;
}

function generateAmount() {
  return (Math.random() * 1000 + 10).toFixed(2);
}

function generateIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateMessage(service, level) {
  const templates = messageTemplates[service] || messageTemplates['api-gateway'];
  const levelTemplates = templates[level] || templates['INFO'];
  let template = getRandomElement(levelTemplates);
  
  // Replace placeholders with realistic data
  template = template.replace(/{}/g, () => {
    const replacements = [
      generateUserId(),
      generateOrderId(),
      generateAmount(),
      generateIP(),
      'campaign_' + Math.floor(Math.random() * 100),
      '/api/v1/users',
      'instance_' + Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 2000) + 'ms'
    ];
    return getRandomElement(replacements);
  });
  
  return template;
}

function generateLogEntry() {
  const service = getRandomElement(services);
  const level = getRandomElement(logLevels);
  const timestamp = getRandomTimestamp();
  const message = generateMessage(service, level);
  
  return {
    '@timestamp': timestamp,
    service: service,
    level: level,
    message: message,
    environment: getRandomElement(['production', 'staging', 'development']),
    version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
    host: `server-${Math.floor(Math.random() * 10) + 1}`,
    correlation_id: `req_${Math.random().toString(36).substr(2, 9)}`
  };
}

async function createIndex() {
  const indexName = 'application-logs-' + new Date().toISOString().split('T')[0];
  
  try {
    // Check if index exists
    const exists = await client.indices.exists({ index: indexName });
    
    if (!exists) {
      // Create index with mapping
      await client.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              '@timestamp': { type: 'date' },
              service: { type: 'keyword' },
              level: { type: 'keyword' },
              message: { type: 'text' },
              environment: { type: 'keyword' },
              version: { type: 'keyword' },
              host: { type: 'keyword' },
              correlation_id: { type: 'keyword' }
            }
          }
        }
      });
      
      console.log(`✅ Created index: ${indexName}`);
    }
    
    return indexName;
  } catch (error) {
    console.error('❌ Error creating index:', error.message);
    throw error;
  }
}

async function insertLogEntries(indexName, count = 1000) {
  const batchSize = 100;
  const batches = Math.ceil(count / batchSize);
  
  console.log(`📊 Generating ${count} log entries in ${batches} batches...`);
  
  for (let batch = 0; batch < batches; batch++) {
    const currentBatchSize = Math.min(batchSize, count - (batch * batchSize));
    const body = [];
    
    for (let i = 0; i < currentBatchSize; i++) {
      const logEntry = generateLogEntry();
      
      // Add index operation
      body.push({
        index: {
          _index: indexName
        }
      });
      
      // Add document
      body.push(logEntry);
    }
    
    try {
      const response = await client.bulk({ body });
      
      if (response.errors) {
        console.error(`❌ Batch ${batch + 1} had errors:`, response.items.filter(item => item.index.error));
      } else {
        console.log(`✅ Batch ${batch + 1}/${batches} completed (${currentBatchSize} entries)`);
      }
    } catch (error) {
      console.error(`❌ Error in batch ${batch + 1}:`, error.message);
    }
  }
}

async function generateTestData(count = 1000) {
  try {
    console.log('🚀 Starting test data generation...');
    console.log(`📈 Target: ${count} log entries`);
    
    // Test connection
    const health = await client.cluster.health();
    console.log(`🔗 Elasticsearch cluster status: ${health.status}`);
    
    // Create index
    const indexName = await createIndex();
    
    // Insert log entries
    await insertLogEntries(indexName, count);
    
    // Refresh index to make data searchable
    await client.indices.refresh({ index: indexName });
    
    // Get final count
    const countResponse = await client.count({ index: indexName });
    
    console.log('🎉 Test data generation completed!');
    console.log(`📊 Total documents in ${indexName}: ${countResponse.count}`);
    console.log(`🏷️  Services: ${services.join(', ')}`);
    console.log(`📋 Log levels: ${logLevels.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    console.error('Make sure Elasticsearch is running and connection details are correct');
  }
}

// Run the script
const count = process.argv[2] ? parseInt(process.argv[2]) : 1000;
generateTestData(count);