const {
  runTopsis,
  validateInputs,
  runSensitivityAnalysis,
} = require("../topsis");

describe("Crisp TOPSIS Engine", () => {
  describe("validateInputs", () => {
    test("accepts valid inputs", () => {
      const matrix = [
        [250, 16, 12],
        [200, 16, 8],
        [300, 32, 16],
      ];
      const weights = [0.25, 0.45, 0.3];
      const impacts = ["-", "+", "+"];
      expect(() => validateInputs(matrix, weights, impacts)).not.toThrow();
    });

    test("throws if fewer than 2 alternatives", () => {
      expect(() =>
        validateInputs([[10, 20]], [0.5, 0.5], ["+", "+"])
      ).toThrow("At least two alternatives (rows) are required.");
    });

    test("throws if fewer than 2 criteria", () => {
      const matrix = [[10], [20]];
      expect(() => validateInputs(matrix, [1], ["+"])).toThrow(
        "At least two criteria (columns) are required."
      );
    });

    test("throws if row lengths are inconsistent", () => {
      const matrix = [
        [10, 20],
        [10, 20, 30],
      ];
      expect(() => validateInputs(matrix, [0.5, 0.5], ["+", "+"])).toThrow(
        "All rows must have the same number of criteria."
      );
    });

    test("throws if weights count does not match criteria count", () => {
      const matrix = [
        [10, 20],
        [30, 40],
      ];
      expect(() => validateInputs(matrix, [0.5], ["+", "+"])).toThrow(
        "Number of weights (1) must match number of criteria (2)."
      );
    });

    test("throws if impacts count does not match criteria count", () => {
      const matrix = [
        [10, 20],
        [30, 40],
      ];
      expect(() => validateInputs(matrix, [0.5, 0.5], ["+"])).toThrow(
        "Number of impacts (1) must match number of criteria (2)."
      );
    });

    test("throws for invalid impact values (neither + nor -)", () => {
      const matrix = [
        [10, 20],
        [30, 40],
      ];
      expect(() => validateInputs(matrix, [0.5, 0.5], ["+", "*"])).toThrow(
        "Impact values must be '+' or '-', got '*'."
      );
    });

    test("throws for zero weights", () => {
      const matrix = [
        [10, 20],
        [30, 40],
      ];
      expect(() => validateInputs(matrix, [0, 0.5], ["+", "+"])).toThrow(
        "All weights must be positive numbers."
      );
    });

    test("throws for negative weights", () => {
      const matrix = [
        [10, 20],
        [30, 40],
      ];
      expect(() => validateInputs(matrix, [-0.2, 0.8], ["+", "+"])).toThrow(
        "All weights must be positive numbers."
      );
    });
  });

  describe("runTopsis", () => {
    test("ranks correctly with mixed benefit and cost criteria", () => {
      const matrix = [
        [250, 16, 12],
        [200, 16, 8],
        [300, 32, 16],
        [275, 32, 8],
        [225, 16, 16],
      ];
      const weights = [0.25, 0.25, 0.25];
      const impacts = ["-", "+", "+"]; // Cost, Benefit, Benefit

      const result = runTopsis(matrix, weights, impacts);
      expect(result).toHaveProperty("scores");
      expect(result).toHaveProperty("ranks");
      expect(result.scores.length).toBe(5);
      expect(result.ranks.length).toBe(5);

      // Verify all ranks from 1 to 5 exist
      const sortedRanks = [...result.ranks].sort((a, b) => a - b);
      expect(sortedRanks).toEqual([1, 2, 3, 4, 5]);

      // Every score is between 0 and 1
      result.scores.forEach((score) => {
        expect(Number.isFinite(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    test("handles all benefit (+) criteria", () => {
      const matrix = [
        [10, 100],
        [20, 200],
        [30, 300],
      ];
      const weights = [0.5, 0.5];
      const impacts = ["+", "+"];

      const { scores, ranks } = runTopsis(matrix, weights, impacts);
      expect(ranks[2]).toBe(1); // Alternative 3 has highest values across both benefit criteria
      expect(ranks[0]).toBe(3); // Alternative 1 has lowest values
      expect(scores[2]).toBeGreaterThan(scores[0]);
    });

    test("handles all cost/negative (-) criteria", () => {
      const matrix = [
        [10, 100],
        [20, 200],
        [30, 300],
      ];
      const weights = [0.5, 0.5];
      const impacts = ["-", "-"];

      const { scores, ranks } = runTopsis(matrix, weights, impacts);
      expect(ranks[0]).toBe(1); // Lowest cost is best
      expect(ranks[2]).toBe(3); // Highest cost is worst
      expect(scores[0]).toBeGreaterThan(scores[2]);
    });

    test("handles zero values / zero denominator gracefully without NaN or Infinity", () => {
      const matrix = [
        [0, 10],
        [0, 20],
      ];
      const weights = [0.5, 0.5];
      const impacts = ["+", "+"];

      const { scores, ranks } = runTopsis(matrix, weights, impacts);
      expect(scores.length).toBe(2);
      scores.forEach((score) => {
        expect(Number.isFinite(score)).toBe(true);
        expect(Number.isNaN(score)).toBe(false);
      });
      expect(ranks).toEqual(expect.arrayContaining([1, 2]));
    });

    test("handles identical alternatives properly", () => {
      const matrix = [
        [50, 50],
        [50, 50],
      ];
      const weights = [0.5, 0.5];
      const impacts = ["+", "+"];

      const { scores, ranks } = runTopsis(matrix, weights, impacts);
      expect(scores.length).toBe(2);
      expect(scores[0]).toBeCloseTo(scores[1], 5);
      expect(ranks.length).toBe(2);
    });
  });

  describe("runSensitivityAnalysis", () => {
    test("calculates stability score and perturbations array", () => {
      const matrix = [
        [250, 16, 12],
        [200, 16, 8],
        [300, 32, 16],
      ];
      const weights = [0.33, 0.33, 0.34];
      const impacts = ["-", "+", "+"];

      const result = runSensitivityAnalysis(matrix, weights, impacts);
      expect(result).toHaveProperty("stabilityScore");
      expect(result).toHaveProperty("isHighlyStable");
      expect(result).toHaveProperty("perturbations");
      expect(result.perturbations.length).toBe(weights.length);

      expect(typeof result.stabilityScore).toBe("number");
      expect(result.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.stabilityScore).toBeLessThanOrEqual(1);
      expect(typeof result.isHighlyStable).toBe("boolean");

      result.perturbations.forEach((p, idx) => {
        expect(p.criteriaIndex).toBe(idx);
        expect(typeof p.isStable).toBe("boolean");
      });
    });
  });
});
