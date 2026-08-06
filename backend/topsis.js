/**
 * Core TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) engine.
 */

function validateInputs(matrix, weights, impacts) {
  if (matrix.length < 2) {
    throw new Error("At least two alternatives (rows) are required.");
  }

  const numCriteria = matrix[0].length;
  if (numCriteria < 2) {
    throw new Error("At least two criteria (columns) are required.");
  }

  for (const row of matrix) {
    if (row.length !== numCriteria) {
      throw new Error("All rows must have the same number of criteria.");
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

  if (weights.some((w) => w <= 0)) {
    throw new Error("All weights must be positive numbers.");
  }
}

function runTopsis(matrix, weights, impacts) {
  validateInputs(matrix, weights, impacts);

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  // Step 1: vector normalization
  const colSumSquares = new Array(numCols).fill(0);
  for (let j = 0; j < numCols; j++) {
    let sumSq = 0;
    for (let i = 0; i < numRows; i++) {
      sumSq += matrix[i][j] * matrix[i][j];
    }
    colSumSquares[j] = Math.sqrt(sumSq) || 1e-12;
  }

  const normMatrix = matrix.map((row) =>
    row.map((val, j) => val / colSumSquares[j])
  );

  // Step 2: apply weights
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const normWeights = weights.map((w) => w / weightSum);

  const weightedMatrix = normMatrix.map((row) =>
    row.map((val, j) => val * normWeights[j])
  );

  // Step 3: ideal best & ideal worst per column
  const idealBest = new Array(numCols).fill(0);
  const idealWorst = new Array(numCols).fill(0);

  for (let j = 0; j < numCols; j++) {
    const col = weightedMatrix.map((row) => row[j]);
    const colMax = Math.max(...col);
    const colMin = Math.min(...col);

    if (impacts[j] === "+") {
      idealBest[j] = colMax;
      idealWorst[j] = colMin;
    } else {
      idealBest[j] = colMin;
      idealWorst[j] = colMax;
    }
  }

  // Step 4: Euclidean distance from ideal best & ideal worst
  const distBest = weightedMatrix.map((row) => {
    let sumSq = 0;
    for (let j = 0; j < numCols; j++) {
      sumSq += (row[j] - idealBest[j]) ** 2;
    }
    return Math.sqrt(sumSq);
  });

  const distWorst = weightedMatrix.map((row) => {
    let sumSq = 0;
    for (let j = 0; j < numCols; j++) {
      sumSq += (row[j] - idealWorst[j]) ** 2;
    }
    return Math.sqrt(sumSq);
  });

  // Step 5: relative closeness score
  const scores = distBest.map((db, i) => {
    const dw = distWorst[i];
    const denom = db + dw || 1e-12;
    return dw / denom;
  });

  // Step 6: rank by score, descending (1 = best)
  const indices = scores.map((_, i) => i);
  indices.sort((a, b) => scores[b] - scores[a]);

  const ranks = new Array(numRows);
  indices.forEach((originalIndex, position) => {
    ranks[originalIndex] = position + 1;
  });

  return { scores, ranks };
}

module.exports = { runTopsis, validateInputs };