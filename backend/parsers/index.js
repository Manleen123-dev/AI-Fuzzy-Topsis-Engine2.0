const path = require("path");

const { parseCsvToMatrix } = require("./csvParser");
const { parseXlsxToMatrix } = require("./xlsxParser");
const { parseJsonToMatrix } = require("./jsonParser");

function getExtension(fileName = "") {
  return path.extname(fileName).toLowerCase();
}

function parseFile(file) {
  if (!file || !file.buffer) {
    throw new Error("No uploaded file buffer was provided.");
  }

  const extension = getExtension(file.originalname || file.name);
  const mimeType = (file.mimetype || "").toLowerCase();

  if (
    extension === ".csv" ||
    mimeType === "text/csv" ||
    mimeType === "application/csv" ||
    mimeType === "text/plain"
  ) {
    return parseCsvToMatrix(file.buffer);
  }

  if (
    extension === ".xlsx" ||
    extension === ".xls" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return parseXlsxToMatrix(file.buffer);
  }

  if (extension === ".json" || mimeType === "application/json") {
    return parseJsonToMatrix(file.buffer);
  }

  throw new Error(
    "Unsupported file type. Please upload a CSV, Excel (.xlsx/.xls), or JSON file."
  );
}

module.exports = {
  parseFile,
  parseCsvToMatrix,
  parseXlsxToMatrix,
  parseJsonToMatrix,
};
