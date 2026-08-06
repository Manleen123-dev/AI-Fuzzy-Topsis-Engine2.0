const { parse } = require("csv-parse/sync");

function parseCsvToMatrix(csvBuffer) {
  const records = parse(csvBuffer, {
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length < 3) {
    throw new Error("CSV must have a header row and at least two data rows.");
  }

  const [header, ...dataRows] = records;

  const criteriaNames = header.slice(1);
  if (criteriaNames.length < 2) {
    throw new Error("CSV must have at least two criteria columns.");
  }

  const alternativeNames = [];
  const matrix = [];

  for (const row of dataRows) {
    if (row.length !== header.length) {
      throw new Error(
        `Row "${row[0]}" has ${row.length} columns, expected ${header.length}.`
      );
    }

    alternativeNames.push(row[0]);

    const parsedValues = row.slice(1).map((val) => {
      const num = Number(val);
      // If it's a valid number, return it. Otherwise, return the raw string (for Fuzzy TOPSIS)
      if (Number.isNaN(num)) {
        return val.trim();
      }
      return num;
    });

    matrix.push(parsedValues);
  }

  return { alternativeNames, criteriaNames, matrix };
}

module.exports = { parseCsvToMatrix };
