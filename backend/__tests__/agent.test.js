const {
  validateAndCoerceLLMOutput,
  buildPrompt,
} = require("../agent");

describe("LLM Agent Layer & Validation", () => {
  const criteria = ["Cost", "Performance", "Durability"];

  describe("validateAndCoerceLLMOutput", () => {
    test("coerces numeric strings and trims impacts", () => {
      const rawLLM = {
        weights: ["0.25", 0.5, "0.25"],
        impacts: [" - ", "+", " + "],
      };

      const result = validateAndCoerceLLMOutput(rawLLM, criteria);
      expect(result.weights).toEqual([0.25, 0.5, 0.25]);
      expect(result.impacts).toEqual(["-", "+", "+"]);
    });

    test("throws error if response is not an object or missing arrays", () => {
      expect(() => validateAndCoerceLLMOutput(null, criteria)).toThrow(
        "LLM response must be a valid JSON object."
      );
      expect(() =>
        validateAndCoerceLLMOutput({ weights: [1, 2, 3] }, criteria)
      ).toThrow("missing 'weights' or 'impacts' arrays");
    });

    test("throws if weights array length does not match criteria count", () => {
      const raw = {
        weights: [0.5, 0.5],
        impacts: ["+", "-", "+"],
      };
      expect(() => validateAndCoerceLLMOutput(raw, criteria)).toThrow(
        "LLM returned 2 weights, but there are 3 criteria."
      );
    });

    test("throws if impacts array length does not match criteria count", () => {
      const raw = {
        weights: [0.3, 0.3, 0.4],
        impacts: ["+"],
      };
      expect(() => validateAndCoerceLLMOutput(raw, criteria)).toThrow(
        "LLM returned 1 impacts, but there are 3 criteria."
      );
    });

    test("throws for non-numeric or non-positive weights", () => {
      expect(() =>
        validateAndCoerceLLMOutput(
          { weights: [0.3, "invalid", 0.4], impacts: ["+", "+", "+"] },
          criteria
        )
      ).toThrow("Invalid weight for criterion 'Performance'");

      expect(() =>
        validateAndCoerceLLMOutput(
          { weights: [0.3, 0, 0.4], impacts: ["+", "+", "+"] },
          criteria
        )
      ).toThrow("Invalid weight for criterion 'Performance'");

      expect(() =>
        validateAndCoerceLLMOutput(
          { weights: [0.3, -0.5, 0.4], impacts: ["+", "+", "+"] },
          criteria
        )
      ).toThrow("Invalid weight for criterion 'Performance'");
    });

    test("throws for invalid impacts", () => {
      expect(() =>
        validateAndCoerceLLMOutput(
          { weights: [0.3, 0.3, 0.4], impacts: ["+", "neutral", "+"] },
          criteria
        )
      ).toThrow("Invalid impact for criterion 'Performance'");

      expect(() =>
        validateAndCoerceLLMOutput(
          { weights: [0.3, 0.3, 0.4], impacts: ["+", 1, "+"] },
          criteria
        )
      ).toThrow("expected string '+' or '-'");
    });
  });

  describe("buildPrompt", () => {
    test("builds prompt including all criteria and user preference", () => {
      const prompt = buildPrompt(criteria, "Looking for high durability");
      expect(prompt).toContain("Cost, Performance, Durability");
      expect(prompt).toContain("Looking for high durability");
      expect(prompt).toContain("weights");
      expect(prompt).toContain("impacts");
    });
  });
});
