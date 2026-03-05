function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = sortObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function buildDeterministicExport({ datasets, journal, spool }) {
  return sortObject({
    datasets,
    journal,
    spool
  });
}

export function stringifyDeterministicExport(payload) {
  return `${JSON.stringify(sortObject(payload), null, 2)}\n`;
}
