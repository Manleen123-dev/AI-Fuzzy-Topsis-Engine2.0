function toNumberMatrix(alternativeNames, criteriaNames, matrix, sourceLabel) {
  if (!Array.isArray(alternativeNames) || !Array.isArray(criteriaNames)) {
    throw new Error(
      `${sourceLabel} must include array fields for alternativeNames and criteriaNames.`
    );
  }

  if (!Array.isArray(matrix) || matrix.length < 2) {
    throw new Error(
      `${sourceLabel} must include at least two alternatives in matrix form.`
    );
  }

  if (criteriaNames.length < 2) {
    throw new Error(`${sourceLabel} must include at least two criteria.`);
  }

  if (alternativeNames.length !== matrix.length) {
    throw new Error(
      `${sourceLabel} has ${alternativeNames.length} alternative names but ${matrix.length} matrix rows.`
    );
  }

  const normalizedMatrix = matrix.map((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== criteriaNames.length) {
      throw new Error(
        `Row ${rowIndex + 1} must contain exactly ${criteriaNames.length} numeric values.`
      );
    }

    return row.map((value) => {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new Error(
          `Non-numeric value "${value}" found for "${alternativeNames[rowIndex]}".`
        );
      }
      return num;
    });
  });

  return {
    alternativeNames: alternativeNames.map((name) => String(name).trim()),
    criteriaNames: criteriaNames.map((name) => String(name).trim()),
    matrix: normalizedMatrix,
  };
}

function parseArrayOfObjects(records) {
  if (records.length < 2) {
    throw new Error("JSON array input must contain at least two alternatives.");
  }

  const firstRecord = records[0];
  if (!firstRecord || typeof firstRecord !== "object" || Array.isArray(firstRecord)) {
    throw new Error("Each JSON array item must be an object.");
  }

  const keys = Object.keys(firstRecord);
  const alternativeKey =
    ["name", "alternative", "alternativeName"].find((key) => keys.includes(key)) ||
    keys[0];
  const criteriaNames = keys.filter((key) => key !== alternativeKey);

  if (criteriaNames.length < 2) {
    throw new Error("JSON array input must contain at least two criteria fields.");
  }

  const alternativeNames = [];
  const matrix = [];

  for (const record of records) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new Error("Each JSON array item must be an object.");
    }

    alternativeNames.push(String(record[alternativeKey]).trim());

    const row = criteriaNames.map((criterion) => {
      const num = Number(record[criterion]);
      if (Number.isNaN(num)) {
        throw new Error(
          `Non-numeric value "${record[criterion]}" found for "${record[alternativeKey]}" in "${criterion}".`
        );
      }
      return num;
    });

    matrix.push(row);
  }

  return {
    alternativeNames,
    criteriaNames,
    matrix,
  };
}

function parseJsonToMatrix(jsonBuffer) {
  let parsed;
  try {
    parsed = JSON.parse(jsonBuffer.toString("utf8"));
  } catch (err) {
    throw new Error("Uploaded JSON is not valid JSON.");
  }

  if (Array.isArray(parsed)) {
    return parseArrayOfObjects(parsed);
  }

  if (parsed && typeof parsed === "object") {
    return toNumberMatrix(
      parsed.alternativeNames,
      parsed.criteriaNames,
      parsed.matrix,
      "JSON object input"
    );
  }

  throw new Error(
    "Unsupported JSON shape. Use either an array of objects or an object with alternativeNames, criteriaNames, and matrix."
  );
}

module.exports = { parseJsonToMatrix };
