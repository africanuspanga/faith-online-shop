export const isMissingColumnError = (message: string) =>
  /column .* does not exist/i.test(message) ||
  /could not find .* column .* schema cache/i.test(message) ||
  /schema cache.*column/i.test(message);
