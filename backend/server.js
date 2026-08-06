/**
 * Express server exposes the TOPSIS + LLM agent pipeline as an HTTP API.
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { runTopsis, validateInputs, runSensitivityAnalysis } = require("./topsis.js");
const { runFuzzyTopsis, runFuzzySensitivityAnalysis } = require("./fuzzyTopsis.js");
const { getWeightsAndImpactsFromLLM } = require("./agent.js");
const { parseFile } = require("./parsers");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

function parseMaybeJson(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

function getUploadedFile(req) {
  const fileFields = req.files || {};
  return fileFields.file?.[0] || fileFields.uploaded_file?.[0] || null;
}

/**
 * POST /api/extract-weights
 * Parses file, gets criteria, calls LLM for weights/impacts, and returns everything
 * so the frontend can display it for user modification.
 */
app.post(
  "/api/extract-weights",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "uploaded_file", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const uploadedFile = getUploadedFile(req);
      const parsedBody = {
        criteriaNames: parseMaybeJson(req.body.criteriaNames),
        alternativeNames: parseMaybeJson(req.body.alternativeNames),
        matrix: parseMaybeJson(req.body.matrix),
        userPreference: req.body.userPreference,
        isFuzzy: req.body.isFuzzy === 'true' || req.body.isFuzzy === true,
      };

      const fileData = uploadedFile ? parseFile(uploadedFile) : null;
      const criteriaNames = fileData?.criteriaNames || parsedBody.criteriaNames;
      const alternativeNames = fileData?.alternativeNames || parsedBody.alternativeNames;
      const matrix = fileData?.matrix || parsedBody.matrix;
      const { userPreference, isFuzzy } = parsedBody;

      if (!criteriaNames || !alternativeNames || !matrix || !userPreference) {
        return res.status(400).json({
          error: "Request must include userPreference and either an uploaded file or matrix data.",
        });
      }

      // 1. Call LLM to get suggested weights and impacts
      const { weights, impacts } = await getWeightsAndImpactsFromLLM(criteriaNames, userPreference);

      // 2. Return everything to frontend so the user can override weights before ranking
      res.json({
        matrix,
        criteriaNames,
        alternativeNames,
        weights,
        impacts,
        isFuzzy
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/rank
 * Takes the confirmed weights, impacts, and matrix, and runs the TOPSIS math.
 * Returns rankings and sensitivity analysis metrics.
 */
app.post("/api/rank", async (req, res, next) => {
  try {
    const { matrix, alternativeNames, weights, impacts, isFuzzy } = req.body;

    if (!matrix || !alternativeNames || !weights || !impacts) {
      return res.status(400).json({ error: "Missing required data for ranking." });
    }

    let scores, ranks, sensitivity;
    
    if (isFuzzy) {
      const fuzzyResult = runFuzzyTopsis(matrix, weights, impacts);
      scores = fuzzyResult.scores;
      ranks = fuzzyResult.ranks;
      sensitivity = runFuzzySensitivityAnalysis(matrix, weights, impacts);
    } else {
      validateInputs(matrix, weights, impacts);
      const crispResult = runTopsis(matrix, weights, impacts);
      scores = crispResult.scores;
      ranks = crispResult.ranks;
      sensitivity = runSensitivityAnalysis(matrix, weights, impacts);
    }

    const results = alternativeNames.map((name, i) => ({
      name,
      score: scores[i],
      rank: ranks[i],
    }));

    results.sort((a, b) => a.rank - b.rank);

    res.json({
      weights,
      impacts,
      results,
      sensitivity
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
