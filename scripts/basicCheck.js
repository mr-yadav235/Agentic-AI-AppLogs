const client = require('../services/elastic');
require('dotenv').config();

async function basicCheck() {
  try {
    console.log('🔍 Basic check of generated test data...\n');
    
    // First, check what indices exist
    const indices = await client.cat.indices({
      index: 'application-logs-*',
      format: 'json'
    });
    
    console.log('📊 Available indices:');
    indices.forEach(index => {
      console.log(`   ${index.index}: ${index['docs.count']} documents`);
    });
    
    // Get sample logs with basic search
    const response = await client.search({
      index: 'application-logs-*',
      size: 5
    });
    
    console.log(`\n📝 Sample of generated logs:`);
    console.log('═'.repeat(80));
    
    if (response && response.hits && response.hits.hits) {
      response.hits.hits.forEach((hit, index) => {
        const source = hit._source;
        if (source) {
          console.log(`${index + 1}. [${source.level || 'N/A'}] ${source.service || 'unknown'}`);
          console.log(`   Time: ${source['@timestamp'] || 'N/A'}`);
          console.log(`   Message: ${source.message || 'No message'}`);
          console.log('─'.repeat(40));
        }
      });
    } else {
      console.log('No logs found or unexpected response format');
    }
    
    console.log('\n✅ Basic check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

basicCheck();