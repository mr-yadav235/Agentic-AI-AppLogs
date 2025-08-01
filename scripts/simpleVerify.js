const client = require('../services/elastic');
require('dotenv').config();

async function simpleVerify() {
  try {
    console.log('🔍 Checking generated test data...\n');
    
    // Get sample logs without aggregations
    const sampleLogs = await client.search({
      index: 'application-logs-*',
      size: 10,
      body: {
        sort: [{ '@timestamp': { order: 'desc' } }]
      }
    });
    
    console.log(`📊 Found ${sampleLogs.hits.total.value || sampleLogs.hits.total} total log entries`);
    console.log('\n📝 Sample Logs Generated:');
    console.log('═'.repeat(80));
    
    sampleLogs.hits.hits.forEach((hit, index) => {
      const source = hit._source;
      const timestamp = new Date(source['@timestamp']).toLocaleString();
      console.log(`${index + 1}. [${timestamp}] [${source.level}] ${source.service}`);
      console.log(`   Message: ${source.message}`);
      console.log(`   Environment: ${source.environment} | Host: ${source.host}`);
      console.log('─'.repeat(80));
    });
    
    // Test a search query like your chatbot would use
    console.log('\n🔍 Testing search functionality...');
    
    const errorLogs = await client.search({
      index: 'application-logs-*',
      size: 3,
      body: {
        query: {
          bool: {
            filter: [
              { term: { 'level.keyword': 'ERROR' } }
            ]
          }
        },
        sort: [{ '@timestamp': { order: 'desc' } }]
      }
    });
    
    console.log(`\n🚨 Recent ERROR logs (${errorLogs.hits.total.value || errorLogs.hits.total} total):`);
    errorLogs.hits.hits.forEach((hit, index) => {
      const source = hit._source;
      console.log(`   ${index + 1}. [${source.service}] ${source.message}`);
    });
    
    console.log('\n✅ Test data verification completed!');
    console.log('🎯 Your AI chatbot is ready to analyze these logs!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleVerify();