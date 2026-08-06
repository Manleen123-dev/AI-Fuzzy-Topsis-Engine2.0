/**
 * LLM Agent Layer
 * -----------------
 * Takes a plain-English preference sentence + the list of column (criteria) names,
 * and asks Groq's LLM to return structured JSON: weights + impacts.
 *
 * This file does NOT do any ranking math — it only translates human language
 * into the exact input shape that topsis.js expects.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Builds the instruction we send to the LLM.
 * We explicitly tell it: return ONLY JSON, nothing else, in this exact shape.
 */
function buildPrompt(criteriaNames, userPreference) {
  return `
You are a strict JSON generator for a decision-making tool.

The criteria (columns) are: ${criteriaNames.join(", ")}

The user's preference, in their own words:
"${userPreference}"

Convert this into a JSON object with exactly two keys:
- "weights": an array of ${criteriaNames.length} positive numbers, one per criterion, in the SAME ORDER as the criteria listed above. Higher number = more important to the user. If the user doesn't mention a criterion, give it a default weight of 1.
- "impacts": an array of ${criteriaNames.length} strings, each either "+" or "-", in the SAME ORDER. Use "+" if higher values of that criterion are better (benefit), "-" if lower values are better (cost). If unclear, default to "+".

Return ONLY the raw JSON object. No explanation, no markdown formatting, no code fences.
`.trim();
}

/**
 * Calls Groq's chat completion API and returns the parsed { weights, impacts } object.
 * Throws an Error if the API fails or returns something that isn't valid JSON.
 */
async function getWeightsAndImpactsFromLLM(criteriaNames, userPreference, retries = 3) {
  const prompt = buildPrompt(criteriaNames, userPreference);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0, 
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      let rawText = data.choices[0].message.content.trim();
      
      // Sometimes LLMs wrap JSON in markdown blocks even when told not to. Clean it up:
      if (rawText.startsWith('```json')) rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      else if (rawText.startsWith('```')) rawText = rawText.replace(/```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        throw new Error(`LLM did not return valid JSON. Raw response: ${rawText}`);
      }

      if (!Array.isArray(parsed.weights) || !Array.isArray(parsed.impacts)) {
        throw new Error("LLM response missing 'weights' or 'impacts' arrays.");
      }

      return parsed; // Success!
    } catch (err) {
      console.warn(`LLM Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) {
        throw new Error(`Failed to get weights from AI after ${retries} attempts. Last error: ${err.message}`);
      }
      // Wait a short delay before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

module.exports = { getWeightsAndImpactsFromLLM, buildPrompt };