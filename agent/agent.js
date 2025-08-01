const { convertToElasticDSL } = require('./planner');
const { executeDSL } = require('./executor');

async function runAgent(naturalQuery) {
  const dsl = await convertToElasticDSL(naturalQuery);
  console.log("dsl :"+dsl);
  const result = await executeDSL(dsl);
  return result || "No logs found.";
}

module.exports = { runAgent };
