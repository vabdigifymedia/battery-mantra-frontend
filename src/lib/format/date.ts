import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === "string") return parseISO(input);
  return new Date(input);
}

export function formatDate(input: Date | string | number, pattern = "dd MMM yyyy"): string {
  try {
    return format(toDate(input), pattern);
  } catch {
    return "—";
  }
}

export function formatDateTime(input: Date | string | number): string {
  return formatDate(input, "dd MMM yyyy, hh:mm a");
}

export function fromNow(input: Date | string | number): string {
  try {
    return `${formatDistanceToNowStrict(toDate(input))} ago`;
  } catch {
    return "—";
  }
}
