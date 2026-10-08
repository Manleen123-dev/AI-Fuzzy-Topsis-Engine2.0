const {
  runFuzzyTopsis,
  validateFuzzyInputs,
  convertToFuzzyMatrix,
  runFuzzySensitivityAnalysis,
  linguisticToTFN,
} = require("../fuzzyTopsis");

describe("Fuzzy TOPSIS Engine", () => {
  describe("validateFuzzyInputs", () => {
    test("validates properly formatted TFN matrix", () => {
      const matrix = [
        [
          [1, 3, 5],
          [5, 7, 9],
        ],
        [
          [3, 5, 7],
          [7, 9, 9],
        ],
      ];
      const weights = [0.5, 0.5];
      const impacts = ["+", "-"];
      expect(() => validateFuzzyInputs(matrix, weights, impacts)).not.toThrow();
    });

    test("throws if fewer than 2 alternatives", () => {
      const matrix = [[[1, 3, 5], [5, 7, 9]]];
      expect(() => validateFuzzyInputs(matrix, [0.5, 0.5], ["+", "+"])).toThrow(
        "At least two alternatives are required."
      );
    });

    test("throws if fewer than 2 criteria", () => {
      const matrix = [[[1, 3, 5]], [[3, 5, 7]]];
      expect(() => validateFuzzyInputs(matrix, [1], ["+"])).toThrow(
        "At least two criteria are required."
      );
    });

    test("throws if matrix elements are not valid 3-element arrays", () => {
      const matrix = [
        [[1, 3], [5, 7, 9]],
        [[3, 5, 7], [7, 9, 9]],
      ];
      expect(() => validateFuzzyInputs(matrix, [0.5, 0.5], ["+", "+"])).toThrow(
        "Matrix values must be fuzzy [l,m,u] arrays"
      );
    });

    test("throws if weights count does not match criteria count", () => {
      const matrix = [
        [[1, 3, 5], [5, 7, 9]],
        [[3, 5, 7], [7, 9, 9]],
      ];
      expect(() => validateFuzzyInputs(matrix, [0.5], ["+", "+"])).toThrow(
        "Number of weights (1) must match number of criteria (2)."
      );
    });

    test("throws if impacts count does not match criteria count", () => {
      const matrix = [
        [[1, 3, 5], [5, 7, 9]],
        [[3, 5, 7], [7, 9, 9]],
      ];
      expect(() => validateFuzzyInputs(matrix, [0.5, 0.5], ["+"])).toThrow(
        "Number of impacts (1) must match number of criteria (2)."
      );
    });

    test("throws if impact is not '+' or '-'", () => {
      const matrix = [
        [[1, 3, 5], [5, 7, 9]],
        [[3, 5, 7], [7, 9, 9]],
      ];
      expect(() => validateFuzzyInputs(matrix, [0.5, 0.5], ["+", "x"])).toThrow(
        "Impact values must be '+' or '-', got 'x'."
      );
    });

    test("throws if weights are zero or negative", () => {
      const matrix = [
        [[1, 3, 5], [5, 7, 9]],
        [[3, 5, 7], [7, 9, 9]],
      ];
      expect(() => validateFuzzyInputs(matrix, [0, 0.5], ["+", "+"])).toThrow(
        "All weights must be positive numbers."
      );
    });
  });

  describe("convertToFuzzyMatrix", () => {
    test("converts linguistic terms into TFN triplets", () => {
      const raw = [
        ["very poor", "good"],
        ["fair", "very good"],
      ];
      const result = convertToFuzzyMatrix(raw);
      expect(result[0][0]).toEqual(linguisticToTFN["very poor"]);
      expect(result[0][1]).toEqual(linguisticToTFN["good"]);
      expect(result[1][0]).toEqual(linguisticToTFN["fair"]);
      expect(result[1][1]).toEqual(linguisticToTFN["very good"]);
    });

    test("converts numeric inputs into crisp [x, x, x] TFNs", () => {
      const raw = [
        [10, "poor"],
        [20, 30],
      ];
      const result = convertToFuzzyMatrix(raw);
      expect(result[0][0]).toEqual([10, 10, 10]);
      expect(result[1][0]).toEqual([20, 20, 20]);
      expect(result[1][1]).toEqual([30, 30, 30]);
    });

    test("throws error on unconvertible values", () => {
      const raw = [
        ["unsupported_term", 10],
        [20, 30],
      ];
      expect(() => convertToFuzzyMatrix(raw)).toThrow(
        'Cannot convert value "unsupported_term" to a Triangular Fuzzy Number.'
      );
    });
  });

  describe("runFuzzyTopsis", () => {
    test("computes ranks and closeness scores for valid fuzzy inputs", () => {
      const rawMatrix = [
        ["poor", "very good", 10],
        ["fair", "good", 15],
        ["very good", "poor", 20],
      ];
      const weights = [0.3, 0.4, 0.3];
      const impacts = ["+", "+", "-"]; // mixed benefit and cost

      const result = runFuzzyTopsis(rawMatrix, weights, impacts);
      expect(result).toHaveProperty("scores");
      expect(result).toHaveProperty("ranks");
      expect(result.scores.length).toBe(3);
      expect(result.ranks.length).toBe(3);

      result.scores.forEach((s) => {
        expect(Number.isFinite(s)).toBe(true);
        expect(Number.isNaN(s)).toBe(false);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      });

      const sortedRanks = [...result.ranks].sort((a, b) => a - b);
      expect(sortedRanks).toEqual([1, 2, 3]);
    });

    test("protects against division by zero and returns finite scores for zero-valued TFNs", () => {
      // Benefit criterion where maxU is 0, cost criterion where elements contain 0
      const rawMatrix = [
        [
          [0, 0, 0],
          [0, 0, 0],
        ],
        [
          [0, 0, 0],
          [0, 0, 0],
        ],
      ];
      const weights = [0.5, 0.5];
      const impacts = ["+", "-"];

      const result = runFuzzyTopsis(rawMatrix, weights, impacts);
      expect(result.scores.length).toBe(2);
      result.scores.forEach((s) => {
        expect(Number.isFinite(s)).toBe(true);
        expect(Number.isNaN(s)).toBe(false);
      });
    });

    test("handles all cost criteria with fuzzy variables", () => {
      const rawMatrix = [
        ["poor", "fair"],
        ["very good", "good"],
      ];
      const weights = [0.5, 0.5];
      const impacts = ["-", "-"];

      const result = runFuzzyTopsis(rawMatrix, weights, impacts);
      expect(result.ranks.length).toBe(2);
      // "poor" has lower values than "very good", so for cost criteria it should rank better
      expect(result.ranks[0]).toBe(1);
      expect(result.ranks[1]).toBe(2);
    });
  });

  describe("runFuzzySensitivityAnalysis", () => {
    test("returns stability score and perturbations array", () => {
      const rawMatrix = [
        ["poor", "very good", 10],
        ["fair", "good", 15],
        ["very good", "poor", 20],
      ];
      const weights = [0.33, 0.33, 0.34];
      const impacts = ["+", "+", "-"];

      const result = runFuzzySensitivityAnalysis(rawMatrix, weights, impacts);
      expect(result).toHaveProperty("stabilityScore");
      expect(result).toHaveProperty("isHighlyStable");
      expect(result).toHaveProperty("perturbations");
      expect(result.perturbations.length).toBe(3);
      expect(result.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.stabilityScore).toBeLessThanOrEqual(1);
    });
  });
});
