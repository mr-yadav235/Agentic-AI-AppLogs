const client = require('../services/elastic');

async function fetchLogs(dslQuery) {
  const result = await client.search({
    index: 'application-logs-*',
    body: JSON.parse(dslQuery),
    size: 10
  });
  
  // Return structured log data instead of concatenated string
  const logs = result.body.hits.hits.map(hit => ({
    timestamp: hit._source['@timestamp'] || new Date().toISOString(),
    service: hit._source.service || 'unknown',
    level: hit._source.level || 'INFO',
    message: hit._source.message || 'No message',
    _score: hit._score
  }));
  
  return {
    total: result.body.hits.total.value || result.body.hits.total,
    logs: logs,
    took: result.took
  };
}

module.exports = { fetchLogs };
