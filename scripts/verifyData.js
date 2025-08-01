const client = require('../services/elastic');
require('dotenv').config();

async function verifyData() {
  try {
    console.log('🔍 Verifying test data in Elasticsearch...\n');
    
    // Get total count
    const countResponse = await client.count({
      index: 'application-logs-*'
    });
    
    console.log(`📊 Total log entries: ${countResponse.count}`);
    
    // Get breakdown by service
    const serviceAgg = await client.search({
      index: 'application-logs-*',
      size: 0,
      body: {
        aggs: {
          services: {
            terms: { field: 'service', size: 20 }
          }
        }
      }
    });
    
    console.log('\n🏷️  Logs by Service:');
    serviceAgg.aggregations.services.buckets.forEach(bucket => {
      console.log(`   ${bucket.key}: ${bucket.doc_count} entries`);
    });
    
    // Get breakdown by log level
    const levelAgg = await client.search({
      index: 'application-logs-*',
      size: 0,
      body: {
        aggs: {
          levels: {
            terms: { field: 'level', size: 10 }
          }
        }
      }
    });
    
    console.log('\n📋 Logs by Level:');
    levelAgg.aggregations.levels.buckets.forEach(bucket => {
      console.log(`   ${bucket.key}: ${bucket.doc_count} entries`);
    });
    
    // Get sample of recent logs
    const sampleLogs = await client.search({
      index: 'application-logs-*',
      size: 5,
      body: {
        sort: [{ '@timestamp': { order: 'desc' } }]
      }
    });
    
    console.log('\n📝 Sample Recent Logs:');
    sampleLogs.hits.hits.forEach((hit, index) => {
      const source = hit._source;
      console.log(`   ${index + 1}. [${source.level}] ${source.service}: ${source.message.substring(0, 60)}...`);
    });
    
    console.log('\n✅ Data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

verifyData();