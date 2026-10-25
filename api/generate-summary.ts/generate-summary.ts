export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API key is not configured on the server.",
    });
  }

  try {
    const caseData = req.body?.caseData;

    if (!caseData || typeof caseData !== "object") {
      return res.status(400).json({
        error: "Case information is required.",
      });
    }

    const prompt = `
Write a concise administrative summary of this patient case.
Use only the provided facts. Do not invent details, diagnose conditions,
or recommend treatment. Identify missing information clearly.

Case information:
${JSON.stringify(caseData)}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      return res.status(502).json({
        error: "Gemini could not generate a summary. Please try again.",
      });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("\n")
      .trim();

    if (!summary) {
      return res.status(502).json({
        error: "Gemini returned an empty summary.",
      });
    }

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Summary generation failed:", error);
    return res.status(500).json({
      error: "Something went wrong while generating the summary.",
    });
  }
}