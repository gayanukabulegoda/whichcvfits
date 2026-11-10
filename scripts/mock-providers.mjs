// Test-process preload only. Never imported by application routes or bundled for deployment.
if (process.env.WHICHCVFITS_PROVIDER_MOCK === "1") {
  if (!process.env.WHICHCVFITS_DB_PATH?.includes("whichcvfits-qa-"))
    throw new Error("Provider mocks require an isolated QA database.");
  const original = globalThis.fetch;
  const failures = new Map();
  globalThis.fetch = async (resource, options = {}) => {
    const url = String(resource?.url || resource);
    if (
      !/^https:\/\/(generativelanguage\.googleapis\.com|api\.anthropic\.com|api\.openai\.com)\//.test(
        url,
      )
    )
      return original(resource, options);
    const provider = url.includes("googleapis")
      ? "google"
      : url.includes("anthropic")
        ? "anthropic"
        : "openai";
    if (!options.body)
      return Response.json(
        provider === "google"
          ? {
              models: [
                {
                  name: "models/gemini-3.8-flash",
                  supportedGenerationMethods: ["generateContent"],
                },
              ],
            }
          : {
              data: [
                {
                  id: provider === "anthropic" ? "claude-sonnet-5-5" : "gpt-5",
                },
              ],
            },
      );
    const body = JSON.parse(String(options.body));
    const prompt =
      provider === "google"
        ? body.contents[0].parts[0].text
        : body.messages.at(-1).content;
    const data = JSON.parse(
      prompt
        .split("UNTRUSTED_CV_JSON_START\n\n")[1]
        .split("\n\nUNTRUSTED_CV_JSON_END")[0],
    );
    if (data.fileName.includes("Fail once") && !failures.has(data.fileName)) {
      failures.set(data.fileName, true);
      return Response.json({}, { status: 401 });
    }
    const spec = JSON.parse(
      prompt.split("\n\n").find((part) => part.startsWith('{"jobTitle":')),
    );
    const lines = data.text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const positive =
      lines.find(
        (l) =>
          l.includes("TypeScript") && !/no experience|not.*experience/i.test(l),
      ) || lines[0];
    const score = data.text.includes("Alex Rivera") ? 95 : 82;
    const result = {
      candidateName: lines[0],
      candidateEmail: "",
      candidateRole: lines[1] || "Engineer",
      yearsExperience: "5+ years",
      subScores: {
        skills: score,
        experience: score,
        impact: score,
        education: score,
      },
      matchedSkills: ["TypeScript"],
      missingSkills: [],
      redFlags: [],
      evidenceQuotes: [
        { requirement: "TypeScript", cvQuote: positive, strength: "strong" },
      ],
      dealbreakerAssessments: spec.mandatoryRequirements.map((requirement) => ({
        requirement,
        status: positive.includes(requirement) ? "met" : "unclear",
        cvQuote: positive.includes(requirement) ? positive : "",
        explanation: positive.includes(requirement)
          ? "Affirmative evidence in the CV."
          : "This requirement is not evidenced.",
      })),
      executiveSummary:
        "Sample professional evidence supports this evaluation. Review the CV and explore specific responsibilities in an interview.",
      recommendationVerdict:
        "Review this candidate with a structured interview.",
      interviewQuestions: [1, 2, 3].map((n) => ({
        question: "Describe production project " + n + ".",
        targetGapOrSkill: "Production experience",
        whatToLookFor:
          "Concrete examples of individual ownership and outcomes.",
      })),
      reasoningLog:
        "Test transport: weighted professional evidence. No real provider call was made.",
    };
    const content = JSON.stringify(result);
    return Response.json(
      provider === "google"
        ? {
            candidates: [
              { content: { parts: [{ text: content }] }, finishReason: "STOP" },
            ],
          }
        : provider === "anthropic"
          ? {
              content: [{ type: "text", text: content }],
              stop_reason: "end_turn",
            }
          : { choices: [{ message: { content }, finish_reason: "stop" }] },
    );
  };
}
