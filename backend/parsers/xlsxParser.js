function parseWorksheetRows(rows, sourceLabel) {
  const nonEmptyRows = rows
    .map((row) =>
      Array.isArray(row)
        ? row.map((cell) =>
            typeof cell === "string" ? cell.trim() : cell
          )
        : row
    )
    .filter(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
    );

  if (nonEmptyRows.length < 3) {
    throw new Error(
      `${sourceLabel} must have a header row and at least two data rows.`
    );
  }

  const [header, ...dataRows] = nonEmptyRows;
  const criteriaNames = header.slice(1).map((name) => String(name).trim());

  if (criteriaNames.length < 2) {
    throw new Error(`${sourceLabel} must have at least two criteria columns.`);
  }

  const alternativeNames = [];
  const matrix = [];

  for (const row of dataRows) {
    if (row.length !== header.length) {
      throw new Error(
        `Row "${row[0]}" has ${row.length} columns, expected ${header.length}.`
      );
    }

    alternativeNames.push(String(row[0]).trim());

    const numericValues = row.slice(1).map((val) => {
      const num = Number(val);
      if (Number.isNaN(num)) {
        throw new Error(`Non-numeric value "${val}" found for "${row[0]}".`);
      }
      return num;
    });

    matrix.push(numericValues);
  }

  return { alternativeNames, criteriaNames, matrix };
}

function parseXlsxToMatrix(xlsxBuffer) {
  let XLSX;
  try {
    XLSX = require("xlsx");
  } catch (err) {
    throw new Error(
      "Excel parsing requires the 'xlsx' package. Install it in backend before using .xlsx files."
    );
  }

  const workbook = XLSX.read(xlsxBuffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel file does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });

  return parseWorksheetRows(rows, "Excel file");
}

module.exports = { parseXlsxToMatrix };
