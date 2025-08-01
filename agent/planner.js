const { askLLM } = require('../services/openai');
const query = {
  "query": {
    "bool": {
      "filter": {
        "term": {
          
        }
      }
    }
  }
}
async function convertToElasticDSL(naturalQuery) {
  const prompt = `
You are an expert in Elasticsearch.
Convert the following log query into Elasticsearch DSL JSON.

Requirements:
- Use "bool" and "filter" for conditions.
- Use "term" with .keyword for exact string matches.
- Use "range" for time filters on @timestamp.
- Only use fields: @timestamp, service, level, message.
- Output only the JSON DSL, no explanation.

Query: "${naturalQuery}"
`;

console.log("PROMPT :"+prompt);
  const response = await askLLM(prompt);
  return response;
}

module.exports = { convertToElasticDSL };
