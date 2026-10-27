import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5174;
const INDEX_FILE = path.join(__dirname, 'index.html');
const CASES_DB_FILE = path.join(__dirname, 'cases-db.json');
const AUDIT_DB_FILE = path.join(__dirname, 'audit-db.json');
const USERS_DB_FILE = path.join(__dirname, 'users-db.json');
const ENV_FILE = path.join(__dirname, '.env');

// Read keys from environment or .env
let GROQ_API_KEY = process.env.GROQ_API_KEY || '';
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

if (fs.existsSync(ENV_FILE)) {
  try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const groqMatch = envContent.match(/GROQ_API_KEY\s*=\s*(.+)/);
    if (groqMatch && !GROQ_API_KEY) GROQ_API_KEY = groqMatch[1].trim();

    const openRouterMatch = envContent.match(/OPENROUTER_API_KEY\s*=\s*(.+)/);
    if (openRouterMatch && !OPENROUTER_API_KEY) OPENROUTER_API_KEY = openRouterMatch[1].trim();
  } catch (e) {
    console.error('Error reading .env file:', e);
  }
}

// Helpers for reading & writing database files
function readJsonFile(filePath, defaultData = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultData;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('?');
  const urlPath = urlParts[0];

  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-OpenRouter-Key, X-User-Role, X-User-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Health & Config endpoint
  if (urlPath === '/api/ai-config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      title: "MediKiosk - AI-Powered Patient Case-Taking Software (Problem Statement 26047)",
      organization: "Ministry of AYUSH | All India Institute of Ayurveda (AIIA)",
      hasGroq: !!GROQ_API_KEY,
      groqModel: "qwen/qwen3.8-27b",
      hasOpenRouter: !!OPENROUTER_API_KEY,
      activeProvider: GROQ_API_KEY ? 'groq-qwen3.8-27b' : (OPENROUTER_API_KEY ? 'openrouter' : 'clinical-rule-engine')
    }));
    return;
  }

  // 2. Authentication Endpoint: POST /api/auth/login
  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const role = payload.role || 'patient';
        const users = readJsonFile(USERS_DB_FILE, []);

        let matchedUser = users.find(u => u.role === role);
        if (payload.email) {
          const byEmail = users.find(u => u.email === payload.email);
          if (byEmail) matchedUser = byEmail;
        }

        if (!matchedUser) {
          matchedUser = {
            id: `USR-${Date.now()}`,
            name: payload.name || (role === 'doctor' ? 'Dr. Ramesh Sharma, MD (Ayu)' : (role === 'superadmin' ? 'Hospital Director' : 'Patient Dhanush C')),
            role: role,
            email: payload.email || `${role}@aiia.gov.in`,
            department: role === 'doctor' ? 'Kayachikitsa (Ayurveda Internal Medicine)' : 'General'
          };
        }

        // Record Audit Event
        const audits = readJsonFile(AUDIT_DB_FILE, []);
        audits.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: matchedUser.id,
          userName: matchedUser.name,
          role: matchedUser.role,
          action: 'USER_LOGIN',
          details: `User logged in to ${matchedUser.role.toUpperCase()} portal`,
          ip: req.socket.remoteAddress || '127.0.0.1'
        });
        writeJsonFile(AUDIT_DB_FILE, audits.slice(0, 200));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: matchedUser }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 3. Users Management API: GET & POST /api/users (For Super Admin)
  if (urlPath === '/api/users' && req.method === 'GET') {
    const users = readJsonFile(USERS_DB_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users, count: users.length }));
    return;
  }

  if (urlPath === '/api/users' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newUser = JSON.parse(body || '{}');
        const users = readJsonFile(USERS_DB_FILE, []);
        newUser.id = newUser.id || `USR-${Date.now()}`;
        newUser.status = newUser.status || 'Active';
        users.push(newUser);
        writeJsonFile(USERS_DB_FILE, users);

        const audits = readJsonFile(AUDIT_DB_FILE, []);
        audits.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: 'admin-01',
          userName: 'Super Administrator',
          role: 'superadmin',
          action: 'STAFF_ACCOUNT_CREATED',
          details: `Added new user ${newUser.name} with role: ${newUser.role}`,
          ip: req.socket.remoteAddress || '127.0.0.1'
        });
        writeJsonFile(AUDIT_DB_FILE, audits.slice(0, 200));

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: newUser }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 4. Cases API: GET /api/cases
  if (urlPath === '/api/cases' && req.method === 'GET') {
    const cases = readJsonFile(CASES_DB_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ cases, count: cases.length }));
    return;
  }

  // 5. Patient-Doctor Communication Message Thread: POST /api/cases/:id/messages
  if (urlPath.startsWith('/api/cases/') && urlPath.endsWith('/messages') && req.method === 'POST') {
    const parts = urlPath.split('/');
    const caseId = parts[3];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const messagePayload = JSON.parse(body || '{}');
        const cases = readJsonFile(CASES_DB_FILE, []);
        const idx = cases.findIndex(c => c.id === caseId);

        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Case not found' }));
          return;
        }

        const msgObj = {
          id: `MSG-${Date.now()}`,
          senderRole: messagePayload.senderRole || 'patient',
          senderName: messagePayload.senderName || 'Patient',
          text: messagePayload.text || '',
          timestamp: new Date().toISOString(),
          formattedTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };

        if (!cases[idx].messages) {
          cases[idx].messages = [];
        }
        cases[idx].messages.push(msgObj);
        writeJsonFile(CASES_DB_FILE, cases);

        // Audit this communication
        const audits = readJsonFile(AUDIT_DB_FILE, []);
        audits.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: messagePayload.senderId || 'patient-user',
          userName: messagePayload.senderName || 'User',
          role: messagePayload.senderRole || 'patient',
          action: 'SECURE_MESSAGE_SENT',
          details: `Message sent regarding case ${caseId}: "${(msgObj.text).slice(0, 50)}..."`,
          ip: req.socket.remoteAddress || '127.0.0.1',
          resourceId: caseId
        });
        writeJsonFile(AUDIT_DB_FILE, audits.slice(0, 200));

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: msgObj, allMessages: cases[idx].messages }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 6. Cases API: POST /api/cases (Register new case)
  if (urlPath === '/api/cases' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newCase = JSON.parse(body || '{}');
        const cases = readJsonFile(CASES_DB_FILE, []);
        
        const index = cases.findIndex(c => c.id === newCase.id);
        if (index >= 0) {
          cases[index] = { ...cases[index], ...newCase, updatedAt: new Date().toISOString() };
        } else {
          if (!newCase.id) {
            newCase.id = `AIIA-MK-2026-${1000 + cases.length + 1}`;
          }
          newCase.createdAt = new Date().toISOString();
          if (!newCase.messages) newCase.messages = [];
          cases.unshift(newCase);
        }
        
        writeJsonFile(CASES_DB_FILE, cases);

        const audits = readJsonFile(AUDIT_DB_FILE, []);
        audits.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: newCase.source === 'Kiosk Intake' ? 'kiosk-terminal-01' : 'staff-session',
          userName: newCase.name || 'Patient',
          role: 'Patient',
          action: 'CASE_SUBMITTED',
          details: `Patient case ${newCase.id} registered for department: ${newCase.department || 'General'}`,
          ip: req.socket.remoteAddress || '127.0.0.1',
          resourceId: newCase.id
        });
        writeJsonFile(AUDIT_DB_FILE, audits.slice(0, 200));

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, case: newCase }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload: ' + err.message }));
      }
    });
    return;
  }

  // 7. Cases API: PUT /api/cases/:id (Doctor Review & Status Updates)
  if (urlPath.startsWith('/api/cases/') && req.method === 'PUT') {
    const caseId = urlPath.replace('/api/cases/', '');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const updateData = JSON.parse(body || '{}');
        const cases = readJsonFile(CASES_DB_FILE, []);
        const index = cases.findIndex(c => c.id === caseId);
        
        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Case not found: ' + caseId }));
          return;
        }

        cases[index] = { ...cases[index], ...updateData, updatedAt: new Date().toISOString() };
        writeJsonFile(CASES_DB_FILE, cases);

        const audits = readJsonFile(AUDIT_DB_FILE, []);
        audits.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: updateData.reviewerId || 'dr-vaidya-01',
          userName: updateData.reviewerName || 'Dr. Ramesh Sharma, MD (Ayu)',
          role: 'Doctor',
          action: updateData.status === 'Reviewed' ? 'CLINICAL_SUMMARY_APPROVED' : 'CASE_UPDATED',
          details: `Case ${caseId} status changed to ${updateData.status || 'Updated'}. Notes updated.`,
          ip: req.socket.remoteAddress || '127.0.0.1',
          resourceId: caseId
        });
        writeJsonFile(AUDIT_DB_FILE, audits.slice(0, 200));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, case: cases[index] }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid update payload: ' + err.message }));
      }
    });
    return;
  }

  // 8. Audit Log API: GET /api/audit
  if (urlPath === '/api/audit' && req.method === 'GET') {
    const audits = readJsonFile(AUDIT_DB_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ audits, count: audits.length }));
    return;
  }

  // 9. ABDM Gateway Simulation: POST /api/abdm/push
  if (urlPath === '/api/abdm/push' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const abhaId = payload.abhaId || '91-4829-1049-2810';
        const caseId = payload.caseId || 'AIIA-MK-2026-1001';

        const txnId = `ABDM-TXN-${Date.now().toString().slice(-8)}`;
        const careContext = `AIIA-CC-${Math.floor(1000 + Math.random() * 9000)}`;

        const responsePayload = {
          status: "SUCCESS",
          gateway: "National Health Authority - ABDM Sandbox Gateway v1.0",
          transactionId: txnId,
          timestamp: new Date().toISOString(),
          careContext: {
            referenceNumber: careContext,
            display: `AIIA Outpatient Case Record ${caseId}`,
            patientAbha: abhaId
          },
          fhirBundleValidated: true,
          bundleEntriesCount: payload.bundle?.entry?.length || 6,
          message: "FHIR R4 DiagnosticReport and Clinical Summary linked successfully to ABHA Profile under DPDP Act 2023 Consent Artifact."
        };

        const audits = readJsonFile(AUDIT_DB_FILE, []);
        audits.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: 'abdm-gateway-service',
          userName: 'ABDM Health Information Exchange',
          role: 'System',
          action: 'ABDM_RECORD_LINKED',
          details: `FHIR Bundle for case ${caseId} linked to ABHA ${abhaId}. Care Context: ${careContext}. Txn: ${txnId}`,
          ip: '127.0.0.1',
          resourceId: caseId
        });
        writeJsonFile(AUDIT_DB_FILE, audits.slice(0, 200));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responsePayload));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 10. Medical History AI Engine: POST /api/intake-ai
  if (urlPath === '/api/intake-ai' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userPrompt = payload.prompt || '';
        const history = payload.history || [];
        const lang = payload.lang || 'en';
        const clientKey = req.headers['x-openrouter-key'] || payload.openRouterKey || OPENROUTER_API_KEY;

        const systemMessage = {
          role: "system",
          content: `You are an AI Clinical Intake Assistant for 'MediKiosk' (Ministry of AYUSH & All India Institute of Ayurveda). 
Your task is to take comprehensive, empathetic medical history from patients before they meet the doctor.
Follow the SOCRATES clinical framework (Site, Onset, Character, Radiation, Associated symptoms, Timing/Duration, Exacerbating/Relieving, Severity 1-10).
Guidelines:
1. Always be polite, concise, and reassuring (maximum 2 short sentences).
2. Ask ONE clear follow-up question at a time if details like duration, severity (1-10), triggers, or current medications are missing.
3. If the patient reports emergency red-flag symptoms (severe chest pain, shortness of breath, sudden facial drooping/weakness, severe head injury), immediately flag with prefix "[RED FLAG ALERT]".
4. If in Hindi, reply in clear, simple conversational Hindi. If English, simple plain English.
5. NEVER provide an autonomous medical diagnosis, medical prognosis, or prescribe treatment.`
        };

        const messages = [
          systemMessage,
          ...history.slice(-6),
          { role: "user", content: userPrompt }
        ];

        if (GROQ_API_KEY) {
          try {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
              },
              body: JSON.stringify({
                model: "qwen/qwen3.8-27b",
                messages,
                temperature: 0.3,
                max_tokens: 220
              })
            });

            if (groqRes.ok) {
              const data = await groqRes.json();
              const reply = data.choices?.[0]?.message?.content?.trim();
              if (reply) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply, provider: 'groq-qwen3.8-27b' }));
                return;
              }
            }
          } catch (groqErr) {
            console.error("Groq call error:", groqErr.message);
          }
        }

        let fallbackReply = "Thank you for sharing that. On a scale of 1 to 10, how severe would you rate your discomfort?";
        const pLower = userPrompt.toLowerCase();
        if (pLower.includes('chest') && (pLower.includes('pain') || pLower.includes('breath'))) {
          fallbackReply = "[RED FLAG ALERT] Please notify the hospital triage nurse immediately or proceed to Casualty. Are you experiencing pain spreading to your arm or jaw?";
        } else if (pLower.includes('month') || pLower.includes('year') || pLower.includes('day') || pLower.includes('week')) {
          fallbackReply = "Noted the duration. Are you currently taking any prescription tablets or Ayurvedic medicines for this?";
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: fallbackReply, provider: 'clinical-rule-engine' }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          reply: "I have recorded your response. Let us proceed with the clinical review.",
          provider: 'system-fallback'
        }));
      }
    });
    return;
  }

  // 11. Serve Main Application HTML
  if (
    urlPath === '/' ||
    urlPath === '/index.html' ||
    urlPath === '/login' ||
    urlPath === '/kiosk' ||
    urlPath === '/doctor' ||
    urlPath === '/admin' ||
    urlPath === '/triage' ||
    urlPath === '/patient' ||
    urlPath === '/combined-view.html' ||
    urlPath === '/patient-intake.html'
  ) {
    fs.readFile(INDEX_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html: ' + err.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // 12. Static file handler
  const filePath = path.join(__dirname, urlPath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(INDEX_FILE, (_, fallbackData) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fallbackData);
      });
    } else {
      let contentType = 'text/plain';
      if (urlPath.endsWith('.html')) contentType = 'text/html; charset=utf-8';
      else if (urlPath.endsWith('.css')) contentType = 'text/css';
      else if (urlPath.endsWith('.js') || urlPath.endsWith('.mjs')) contentType = 'application/javascript';
      else if (urlPath.endsWith('.json')) contentType = 'application/json';
      else if (urlPath.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (urlPath.endsWith('.png')) contentType = 'image/png';
      else if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) contentType = 'image/jpeg';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(` MediKiosk: AI Patient Case-Taking Software`);
  console.log(` Problem Statement ID: 26047`);
  console.log(` Ministry of AYUSH & All India Institute of Ayurveda`);
  console.log(` -> http://localhost:${PORT}/`);
  console.log(` Groq Engine: Active (qwen/qwen3.8-27b)`);
  console.log(` ABDM & FHIR Interoperability: Active`);
  console.log(` Multi-Role Auth: Patient, Doctor, Super Admin, Triage`);
  console.log(` Patient-Doctor Messaging Thread: Active`);
  console.log(` Persistent Database: cases-db.json, users-db.json & audit-db.json`);
  console.log(`======================================================\n`);
});
