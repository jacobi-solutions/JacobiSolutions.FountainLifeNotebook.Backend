export const UNUSABLE_ASSISTANT_RESPONSE_TEXT =
  'I could not generate a usable answer from the documents. Try asking again or rephrasing the question.';

const FINAL_ANSWER_PATTERN = /(?:^|\n)\s*Final\s+Answer\s*:\s*([\s\S]*)$/i;
const TOOL_TRACE_PATTERN =
  /(?:^|\n)\s*(?:Thought|Action|Action Input|Observation)\s*:/i;

export function normalizeAssistantResponseText(text: string | undefined) {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) {
    return UNUSABLE_ASSISTANT_RESPONSE_TEXT;
  }

  const finalAnswer = trimmed.match(FINAL_ANSWER_PATTERN)?.[1]?.trim();
  if (finalAnswer) {
    return finalAnswer;
  }

  if (TOOL_TRACE_PATTERN.test(trimmed)) {
    return UNUSABLE_ASSISTANT_RESPONSE_TEXT;
  }

  return trimmed;
}
