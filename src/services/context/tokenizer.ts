const CHARS_PER_TOKEN = 4;

export function countTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function truncateToTokens(text: string, maxTokens: number): string {
  if (maxTokens <= 0) return '';
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;

  const truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n');
  if (lastNewline > maxChars * 0.8) {
    return truncated.slice(0, lastNewline);
  }

  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace);
  }

  return truncated;
}

export function countMessageTokens(content: string, role: string): number {
  const roleOverhead = 4;
  return countTokens(content) + roleOverhead;
}
