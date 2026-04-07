const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toDateFromAgeYears = (ageYears) =>
  new Date(Date.now() - Number(ageYears) * MS_PER_YEAR);

function buildAssetFilterFromInput(input = {}) {
  const {
    search,
    status,
    manufacturer,
    model,
    description,
    ageMin,
    ageMax,
  } = input;

  const filter = {};

  if (status) filter.status = status;
  if (manufacturer) filter.manufacturer = manufacturer;
  if (model) filter.model = model;
  if (description) filter.description = description;

  if (search) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [
      { serialNumber: regex },
      { currentName: regex },
      { model: regex },
      { manufacturer: regex },
      { "renameHistory.renamedFrom": regex },
      { "renameHistory.renamedTo": regex },
    ];
  }

  if (ageMin || ageMax) {
    filter.purchaseDate = {};
    // Older assets have earlier purchase dates.
    if (ageMin) filter.purchaseDate.$lte = toDateFromAgeYears(ageMin);
    if (ageMax) filter.purchaseDate.$gte = toDateFromAgeYears(ageMax);
  }

  return filter;
}

function pickColumns(doc, columns = []) {
  if (!Array.isArray(columns) || columns.length === 0) return doc;
  const out = {};
  columns.forEach((col) => {
    if (doc[col] !== undefined) out[col] = doc[col];
  });
  return out;
}

module.exports = {
  MS_PER_YEAR,
  buildAssetFilterFromInput,
  pickColumns,
};
