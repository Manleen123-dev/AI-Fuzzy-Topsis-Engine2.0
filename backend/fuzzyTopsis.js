/**
 * Fuzzy TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) engine.
 * Uses Triangular Fuzzy Numbers (TFN) represented as [l, m, u] arrays.
 */

// Mapping linguistic variables to Triangular Fuzzy Numbers (scale 1 to 9)
const linguisticToTFN = {
  "very poor": [1, 1, 3],
  "poor": [1, 3, 5],
  "fair": [3, 5, 7],
  "good": [5, 7, 9],
  "very good": [7, 9, 9],
};

function normalizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().toLowerCase();
}

/**
 * Validates a fuzzy matrix where elements should be [l, m, u] arrays.
 */
function validateFuzzyInputs(matrix, weights, impacts) {
  if (matrix.length < 2) throw new Error("At least two alternatives are required.");
  const numCriteria = matrix[0].length;
  if (numCriteria < 2) throw new Error("At least two criteria are required.");

  for (const row of matrix) {
    if (row.length !== numCriteria) throw new Error("All rows must have same number of criteria.");
    for (const val of row) {
      if (!Array.isArray(val) || val.length !== 3) {
        throw new Error(`Matrix values must be fuzzy [l,m,u] arrays. Got: ${JSON.stringify(val)}`);
      }
      if (val.some(v => typeof v !== 'number' || !Number.isFinite(v))) {
        throw new Error(`Fuzzy values must contain finite numbers. Got: ${JSON.stringify(val)}`);
      }
    }
  }

  if (weights.length !== numCriteria) {
    throw new Error(
      `Number of weights (${weights.length}) must match number of criteria (${numCriteria}).`
    );
  }

  if (impacts.length !== numCriteria) {
    throw new Error(
      `Number of impacts (${impacts.length}) must match number of criteria (${numCriteria}).`
    );
  }

  for (const impact of impacts) {
    if (impact !== "+" && impact !== "-") {
      throw new Error(`Impact values must be '+' or '-', got '${impact}'.`);
    }
  }

  if (weights.some((w) => w <= 0 || !Number.isFinite(w))) {
    throw new Error("All weights must be positive numbers.");
  }
}

/**
 * Converts a mixed matrix (numbers or linguistic strings) into a strict Fuzzy matrix (TFNs).
 */
function convertToFuzzyMatrix(rawMatrix) {
  return rawMatrix.map(row => 
    row.map(val => {
      // If it's already a TFN [l,m,u]
      if (Array.isArray(val) && val.length === 3) return val;
      
      // If it's a number, make it a crisp fuzzy number [val, val, val]
      if (typeof val === 'number') return [val, val, val];
      
      // If it's a string, look up the linguistic variable
      const str = normalizeString(val);
      if (linguisticToTFN[str]) return linguisticToTFN[str];
      
      // Attempt to parse string as number
      const num = Number(val);
      if (!Number.isNaN(num)) return [num, num, num];

      throw new Error(`Cannot convert value "${val}" to a Triangular Fuzzy Number.`);
    })
  );
}

/**
 * Main Fuzzy TOPSIS Algorithm
 * matrix: Array of Arrays containing TFNs [l, m, u]
 * weights: Array of crisp weights (from LLM)
 * impacts: Array of "+" or "-" strings
 */
function runFuzzyTopsis(rawMatrix, weights, impacts) {
  const matrix = convertToFuzzyMatrix(rawMatrix);
  validateFuzzyInputs(matrix, weights, impacts);

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  // Step 1: Normalize the Fuzzy Matrix with protection against division-by-zero, NaN, and Infinity
  const normMatrix = [];
  for (let i = 0; i < numRows; i++) {
    normMatrix.push(new Array(numCols));
  }

  for (let j = 0; j < numCols; j++) {
    if (impacts[j] === '+') {
      let maxU = -Infinity;
      for (let i = 0; i < numRows; i++) {
        if (matrix[i][j][2] > maxU) maxU = matrix[i][j][2];
      }
      const denom = (maxU === 0 || !Number.isFinite(maxU)) ? 1e-12 : maxU;
      for (let i = 0; i < numRows; i++) {
        const [l, m, u] = matrix[i][j];
        normMatrix[i][j] = [
          Number.isFinite(l / denom) ? l / denom : 0,
          Number.isFinite(m / denom) ? m / denom : 0,
          Number.isFinite(u / denom) ? u / denom : 0,
        ];
      }
    } else {
      let minL = Infinity;
      for (let i = 0; i < numRows; i++) {
        if (matrix[i][j][0] < minL) minL = matrix[i][j][0];
      }
      for (let i = 0; i < numRows; i++) {
        const [l, m, u] = matrix[i][j];
        const denomU = (u === 0 || !Number.isFinite(u)) ? 1e-12 : u;
        const denomM = (m === 0 || !Number.isFinite(m)) ? 1e-12 : m;
        const denomL = (l === 0 || !Number.isFinite(l)) ? 1e-12 : l;
        normMatrix[i][j] = [
          Number.isFinite(minL / denomU) ? minL / denomU : 0,
          Number.isFinite(minL / denomM) ? minL / denomM : 0,
          Number.isFinite(minL / denomL) ? minL / denomL : 0,
        ];
      }
    }
  }

  // Step 2: Apply Crisp Weights (from LLM)
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1e-12;
  const normWeights = weights.map(w => w / weightSum);

  const weightedMatrix = normMatrix.map(row => 
    row.map((tfn, j) => {
      const w = normWeights[j];
      return [tfn[0]*w, tfn[1]*w, tfn[2]*w];
    })
  );

  // Step 3: Fuzzy Positive Ideal Solution (FPIS) & Fuzzy Negative Ideal Solution (FNIS)
  const FPIS = new Array(numCols);
  const FNIS = new Array(numCols);

  for (let j = 0; j < numCols; j++) {
    const w = normWeights[j];
    FPIS[j] = [w, w, w];
    FNIS[j] = [0, 0, 0];
  }

  // Step 4: Distance from Ideal Solutions (Vertex Method)
  // d(x, y) = sqrt( 1/3 * [ (l1-l2)^2 + (m1-m2)^2 + (u1-u2)^2 ] )
  const distBest = new Array(numRows).fill(0);
  const distWorst = new Array(numRows).fill(0);

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      const v = weightedMatrix[i][j];
      const pBest = FPIS[j];
      const pWorst = FNIS[j];

      const dBest = Math.sqrt( ( (v[0]-pBest[0])**2 + (v[1]-pBest[1])**2 + (v[2]-pBest[2])**2 ) / 3 );
      const dWorst = Math.sqrt( ( (v[0]-pWorst[0])**2 + (v[1]-pWorst[1])**2 + (v[2]-pWorst[2])**2 ) / 3 );

      distBest[i] += Number.isFinite(dBest) ? dBest : 0;
      distWorst[i] += Number.isFinite(dWorst) ? dWorst : 0;
    }
  }

  // Step 5: Closeness Coefficient (Score)
  const scores = distBest.map((db, i) => {
    const dw = distWorst[i];
    const denom = db + dw || 1e-12;
    const score = dw / denom;
    return Number.isFinite(score) ? score : 0;
  });

  // Step 6: Rank
  const indices = scores.map((_, i) => i);
  indices.sort((a, b) => scores[b] - scores[a]);

  const ranks = new Array(numRows);
  indices.forEach((originalIndex, position) => {
    ranks[originalIndex] = position + 1;
  });

  return { scores, ranks };
}

/**
 * Runs Sensitivity Analysis by perturbing each weight by +10% 
 * and checking if the #1 ranked alternative changes.
 */
function runFuzzySensitivityAnalysis(matrix, originalWeights, impacts) {
  const { ranks: originalRanks } = runFuzzyTopsis(matrix, originalWeights, impacts);
  const originalTopChoiceIndex = originalRanks.indexOf(1);
  
  let stableCount = 0;
  const perturbations = [];

  for (let i = 0; i < originalWeights.length; i++) {
    // Increase weight by 10%
    const newWeights = [...originalWeights];
    newWeights[i] = newWeights[i] * 1.1;
    
    // Normalize weights back to sum to 1
    const sum = newWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = newWeights.map(w => w / sum);

    const { ranks: newRanks } = runFuzzyTopsis(matrix, normalizedWeights, impacts);
    const newTopChoiceIndex = newRanks.indexOf(1);
    
    const isStable = newTopChoiceIndex === originalTopChoiceIndex;
    if (isStable) stableCount++;

    perturbations.push({
      criteriaIndex: i,
      isStable
    });
  }

  const stabilityScore = stableCount / originalWeights.length;
  
  return {
    stabilityScore,
    isHighlyStable: stabilityScore >= 0.8,
    perturbations
  };
}

module.exports = {
  linguisticToTFN,
  validateFuzzyInputs,
  convertToFuzzyMatrix,
  runFuzzyTopsis,
  runFuzzySensitivityAnalysis,
};
