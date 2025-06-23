const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { pipeline } = require("@xenova/transformers");
const Document = require("./models/Document");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ✅ Sample documents to compare against
const sampleDocuments = [
  "The quick brown fox jumps over the lazy dog.",
  "Artificial intelligence is transforming the world.",
  "Plagiarism detection systems compare text similarity using embeddings.",
  "React is a frontend JavaScript library for building user interfaces.",
];

// ✅ Cosine Similarity Function
function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dot / (mag1 * mag2);
}

// ✅ MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://swasti:Test12345%21@plagiarism-cluster.fxvwcud.mongodb.net/?retryWrites=true&w=majority&appName=plagiarism-cluster",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ✅ Load the AI model once
let extractor;
(async () => {
  extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("✅ AI model loaded");
})();

// ✅ API: POST /check
app.post("/check", async (req, res) => {
  const { text } = req.body;

  if (!text || !extractor) {
    return res.status(400).json({ message: "Missing input or model not ready" });
  }

  const inputVec = await extractor(text, { pooling: "mean", normalize: true });

  const matches = [];
  for (let doc of sampleDocuments) {
    const docVec = await extractor(doc, { pooling: "mean", normalize: true });
    const similarity = cosineSimilarity(inputVec.data, docVec.data);
    if (similarity >= 0.8) {
      matches.push({ doc, similarity: parseFloat(similarity.toFixed(2)) });
    }
  }

  // ✅ Save to MongoDB
  await Document.create({ text, matches });

  res.json({ matches });
});

// ✅ API: GET /history
app.get("/history", async (req, res) => {
  const history = await Document.find().sort({ createdAt: -1 });
  res.json(history);
});

// ✅ Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
