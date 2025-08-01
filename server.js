const express = require("express");
const cors = require("cors");
const { runAgent } = require("./agent/agent");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post("/query", async (req, res) => {
  const { question } = req.body;
  const result = await runAgent(question);
  res.send({ response: result });
});

app.listen(3000, () => console.log("Agent listening on http://localhost:3000"));
