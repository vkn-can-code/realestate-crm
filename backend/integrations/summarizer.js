// Call/chat summarization plug slot — writes the Follow-up 1 summary after
// every call or WhatsApp conversation, and extracts the callback / meeting ask.
// TODO(dev): send the transcript to your summarization model and parse the
// callback/meeting intent out of the reply.

function assertConfigured() {
  if (!process.env.SUMMARIZATION_API_KEY) {
    throw new Error("Summarizer is not configured yet. Add SUMMARIZATION_API_KEY to .env");
  }
}

/** Summarizes a call/chat transcript into a short follow-up note. */
export async function summarizeConversation({ transcript }) {
  assertConfigured();
  // TODO(dev): call the summarization model here
  return {
    summary: "Summary pending — connect SUMMARIZATION_API_KEY.",
    requestedCallbackAt: null,
    requestedMeeting: false,
  };
}

export default { summarizeConversation };
