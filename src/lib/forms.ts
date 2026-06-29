export function optionalString(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

export function requiredString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalDate(value: FormDataEntryValue | null) {
  const text = optionalString(value);
  return text ? new Date(text) : undefined;
}

export function checkboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

