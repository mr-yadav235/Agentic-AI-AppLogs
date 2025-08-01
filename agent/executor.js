const { fetchLogs } = require('../tools/logTool');

async function executeDSL(dslQuery) {
  return await fetchLogs(dslQuery);
}

module.exports = { executeDSL };
