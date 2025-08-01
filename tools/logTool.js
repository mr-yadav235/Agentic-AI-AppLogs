const client = require('../services/elastic');

async function fetchLogs(dslQuery) {
  const result = await client.search({
    index: 'application-logs-*',
    body: JSON.parse(dslQuery),
    size: 10
  });
var data = []
  return result.body.hits.hits.map(hit => hit._source.message).join('/n,');
}

module.exports = { fetchLogs };
