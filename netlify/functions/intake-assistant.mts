export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;

  try {
    const payload = await request.json();
    const userPrompt = payload.prompt || '';
    const history = payload.history || [];
    const currentTopicIndex = payload.topicIndex ?? 0;

    // Check emergency red flags immediately
    const lowerPrompt = userPrompt.toLowerCase();
    const isEmergency = 
      (lowerPrompt.includes('chest') && (lowerPrompt.includes('pain') || lowerPrompt.includes('pressure'))) ||
      lowerPrompt.includes('breathing difficulty') ||
      lowerPrompt.includes('shortness of breath') ||
      lowerPrompt.includes('loss of consciousness') ||
      lowerPrompt.includes('coughing blood') ||
      (lowerPrompt.includes('stroke') || lowerPrompt.includes('facial drooping') || lowerPrompt.includes('arm weakness'));

    if (isEmergency) {
      return Response.json({
        reply: "[RED FLAG ALERT] Based on what you described, you may require immediate emergency medical care. Please inform the hospital triage nurse immediately or proceed to the Casualty / Emergency ward.",
        isEmergency: true,
        topicIndex: currentTopicIndex,
        quickOptions: ["Notify Nurse Now", "Proceed to Casualty", "Continue Non-Urgent Intake"],
        provider: "emergency-rule"
      });
    }

    if (!apiKey) {
      // Deterministic Clinical Intake Engine (Fallback when API key not configured)
      const fallback = generateIntakeFallback(userPrompt, history, currentTopicIndex);
      return Response.json(fallback);
    }

    const systemPrompt = `You are the empathetic, intelligent AI Clinical Intake Assistant for 'CaseAssist' (Ministry of AYUSH & All India Institute of Ayurveda).
You are conducting a patient history-taking conversation before the doctor consults the patient.

CRITICAL RULES:
1. NEVER ask patients to rate pain or symptoms on a numerical scale of 1 to 10. Instead, ask descriptive questions (e.g. "Is the pain mild, moderate, or severe?", "Does it feel sharp, dull, burning, or aching?").
2. Ask only ONE simple, clear question at a time.
3. Understand short answers, typos, colloquial terms, and simple English.
4. If the patient says "I don't understand" or is confused, explain the question using very simple, reassuring everyday language. NEVER repeat the previous question verbatim.
5. If the patient says "I don't know", "not sure", or wants to skip, politely acknowledge and move on to the next topic.
6. The clinical interview covers 12 logical steps:
   (1) Chief complaint / Main reason for visit
   (2) Affected body area & sensation
   (3) When symptoms started (duration)
   (4) Continuous vs intermittent (comes and goes)
   (5) Progression (improving, worsening, or unchanged)
   (6) Other associated symptoms
   (7) Current medicines & supplements
   (8) Known allergies
   (9) Chronic medical conditions (diabetes, BP, etc.)
   (10) Past surgeries or hospitalizations
   (11) Family medical history
   (12) Any other concerns
7. Never provide a medical diagnosis or prescribe medications.
8. Keep your response brief, warm, and conversational (1 to 2 sentences maximum, followed by the next single question).`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8),
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
        temperature: 0.35,
        max_tokens: 220,
      }),
    });

    if (result.ok) {
      const data = await result.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return Response.json({
          reply,
          provider: "groq-qwen3.8-27b",
          topicIndex: Math.min(11, currentTopicIndex + 1),
          quickOptions: getQuickOptionsForTopic(currentTopicIndex + 1)
        });
      }
    }

    // Fallback if Groq returns empty
    const fallback = generateIntakeFallback(userPrompt, history, currentTopicIndex);
    return Response.json(fallback);
  } catch (err: any) {
    console.error("Intake assistant error:", err);
    return Response.json({
      reply: "Thank you for sharing that information. Could you tell me whether this discomfort is getting better, worse, or staying about the same?",
      topicIndex: 4,
      quickOptions: ["Getting better", "Getting worse", "Staying the same", "I'm not sure"],
      provider: "system-fallback"
    });
  }
}

/**
 * Deterministic Adaptive State Machine for 12 Clinical Intake Steps
 */
function generateIntakeFallback(userPrompt: string, history: any[], currentTopic: number) {
  const text = (userPrompt || '').toLowerCase().trim();

  // Handle "I don't understand" or confusion
  if (
    text.includes("don't understand") ||
    text.includes("dont understand") ||
    text.includes("what do you mean") ||
    text === 'what' ||
    text === 'huh' ||
    text === 'explain'
  ) {
    return {
      reply: "No problem at all! Let me ask more simply: in your own everyday words, what body part is bothering you right now, and how does it feel?",
      topicIndex: currentTopic,
      quickOptions: ["Mild pain", "Moderate pain", "Severe discomfort", "I want to skip this"],
      provider: "conversational-simplifier"
    };
  }

  // Handle "I don't know" or "skip"
  if (
    text.includes("don't know") ||
    text.includes("dont know") ||
    text.includes("not sure") ||
    text === 'skip' ||
    text === 'no idea'
  ) {
    const nextTopic = Math.min(11, currentTopic + 1);
    const question = getQuestionForTopic(nextTopic);
    return {
      reply: `That is completely fine! We can move forward. ${question.prompt}`,
      topicIndex: nextTopic,
      quickOptions: question.options,
      provider: "adaptive-navigator"
    };
  }

  // Next logical clinical topic
  const nextTopic = Math.min(11, currentTopic + 1);
  const nextQ = getQuestionForTopic(nextTopic);

  return {
    reply: `Thank you for explaining that clearly. ${nextQ.prompt}`,
    topicIndex: nextTopic,
    quickOptions: nextQ.options,
    provider: "clinical-history-engine"
  };
}

function getQuestionForTopic(index: number): { prompt: string; options: string[] } {
  switch (index) {
    case 0:
      return {
        prompt: "What primary health concern or symptom brought you to the hospital today?",
        options: ["Joint / back pain", "Digestive / stomach issue", "Fever & weakness", "Skin problem", "Other concern"]
      };
    case 1:
      return {
        prompt: "Can you tell me which part of your body is affected, and does the pain feel sharp, dull, burning, or aching?",
        options: ["Sharp / stabbing", "Dull ache", "Burning sensation", "Throbbing / stiff", "Mild discomfort"]
      };
    case 2:
      return {
        prompt: "Approximately when did this problem first start?",
        options: ["Just today", "2 to 3 days ago", "About a week ago", "Over a month ago", "Chronic (several months)"]
      };
    case 3:
      return {
        prompt: "Does this symptom trouble you continuously throughout the day, or does it come and go?",
        options: ["It is continuous", "Comes and goes in waves", "Worse in morning", "Worse at night", "Triggered by meals"]
      };
    case 4:
      return {
        prompt: "Over the past few days, has the condition been improving, worsening, or staying about the same?",
        options: ["Getting worse", "Gradually improving", "Staying about the same", "Fluctuates daily"]
      };
    case 5:
      return {
        prompt: "Have you noticed any other related symptoms, such as fever, nausea, fatigue, headache, or sleep disturbances?",
        options: ["None", "Mild fever / chills", "Nausea / loss of appetite", "Difficulty sleeping", "Fatigue & weakness"]
      };
    case 6:
      return {
        prompt: "Are you currently taking any prescription tablets, daily supplements, or Ayurvedic remedies?",
        options: ["No daily medicines", "Blood pressure medicine", "Diabetes tablets", "Ayurvedic herbs/churna", "Pain relievers"]
      };
    case 7:
      return {
        prompt: "Do you have any known allergies to medicines, foods, or herbal substances?",
        options: ["No known allergies (NKDA)", "Penicillin / antibiotics", "Sulfa drugs", "Food allergies", "I am not sure"]
      };
    case 8:
      return {
        prompt: "Have you previously been diagnosed with any chronic health conditions, such as high blood pressure, diabetes, thyroid, or asthma?",
        options: ["None", "Diabetes (high sugar)", "Hypertension (high BP)", "Thyroid disorder", "Asthma / breathing problem"]
      };
    case 9:
      return {
        prompt: "Have you had any prior hospitalizations or surgical procedures in the past?",
        options: ["No past surgeries", "Appendectomy / gall bladder", "Orthopedic / joint surgery", "Past hospitalization only", "I prefer not to say"]
      };
    case 10:
      return {
        prompt: "Is there any history of diabetes, heart illness, arthritis, or asthma in your immediate family?",
        options: ["None known", "Diabetes in family", "Heart illness in family", "Hypertension in family", "Joint disorders / arthritis"]
      };
    case 11:
    default:
      return {
        prompt: "Is there anything else about your health or lifestyle you would like the doctor to know before your consultation?",
        options: ["Everything covered", "Have recent test reports", "Dietary restrictions", "Stress / work pressure"]
      };
  }
}

function getQuickOptionsForTopic(index: number): string[] {
  return getQuestionForTopic(index).options;
}

export const config = {
  path: "/api/intake-assistant",
};
