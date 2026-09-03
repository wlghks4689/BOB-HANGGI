export const isValidBirthDate = (value: string) => {
  const match = value.match(/^(\d{4})[.\-/](\d{2})[.\-/](\d{2})$/);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date <= new Date()
  );
};

export const normalizePhoneNumber = (value: string) => value.replace(/[^0-9]/g, '');

export const isValidPhoneNumber = (value: string) => {
  const digits = normalizePhoneNumber(value);
  return digits.length >= 10 && digits.length <= 11;
};
