export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json({
      reply: "Thank you for describing your symptoms. On a scale of 1 to 10, how severe is your discomfort?",
      provider: "clinical-rule-fallback"
    });
  }

  try {
    const payload = await request.json();
    const userPrompt = payload.prompt || '';
    const history = payload.history || [];

    const systemPrompt = `You are an AI Clinical Intake Assistant for 'CaseAssist' (Ministry of AYUSH & All India Institute of Ayurveda).
Your job is to take comprehensive, empathetic, and clear medical history from patients before they meet the doctor.
Follow the SOCRATES clinical framework (Site, Onset, Character, Radiation, Associated symptoms, Timing/Duration, Exacerbating/Relieving, Severity 1-10).
Guidelines:
1. Always be polite, concise, and reassuring (maximum 2-3 short sentences).
2. Ask ONE clear follow-up question at a time (e.g. asking for duration, pain severity from 1-10, or current medications).
3. If the patient reports emergency red-flag symptoms (severe chest pain, shortness of breath, sudden facial drooping/weakness, heavy bleeding), immediately start reply with "[RED FLAG ALERT]".
4. Do NOT provide an autonomous diagnosis or recommend treatment.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6),
      { role: "user", content: userPrompt }
    ];

    const result = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages,
        temperature: 0.3,
        max_tokens: 250,
      }),
    });

    if (result.ok) {
      const data = await result.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return Response.json({ reply, provider: "groq-qwen3.8-27b" });
      }
    }

    return Response.json({
      reply: "Noted your symptoms. How long have you been experiencing this discomfort, and is it getting better or worse?",
      provider: "system-fallback"
    });
  } catch (err: any) {
    console.error("Intake assistant error:", err);
    return Response.json({
      reply: "I have recorded your response. Let us proceed with the clinical review.",
      provider: "system-fallback"
    });
  }
}

export const config = {
  path: "/api/intake-assistant",
};
