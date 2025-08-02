const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Build Elasticsearch client configuration
const clientConfig = {
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
};

// Add authentication if credentials are provided
if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
  clientConfig.auth = {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  };
}

const client = new Client(clientConfig);

module.exports = client;
