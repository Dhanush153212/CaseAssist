import { onAuthStateChanged, signOut } from 'firebase/auth';
import { signIn, signUp } from './auth';
import { useEffect, useState, type FormEvent } from 'react';
import type { ReactNode } from 'react';
import './App.css';
import { auth } from './firebase';
type PatientCase = {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  hospital: string;
  department: string;
  complaint: string;
  priority: string;
  status: string;
  date: string;
};

const sampleCases: PatientCase[] = [
  { id: 'CA-1001', name: 'Aarav Sharma', age: 42, gender: 'Male', city: 'Bengaluru', hospital: 'Victoria Hospital', department: 'Cardiology', complaint: 'Routine cardiac assessment', priority: 'High', status: 'Under Review', date: '2026-10-20' },
  { id: 'CA-1002', name: 'Priya Reddy', age: 29, gender: 'Female', city: 'Hyderabad', hospital: 'Osmania General Hospital', department: 'General Medicine', complaint: 'Follow-up consultation', priority: 'Medium', status: 'New', date: '2026-10-20' },
  { id: 'CA-1003', name: 'Arjun Kumar', age: 55, gender: 'Male', city: 'Chennai', hospital: 'Rajiv Gandhi Government General Hospital', department: 'Orthopaedics', complaint: 'Joint pain assessment', priority: 'Medium', status: 'Completed', date: '2026-10-19' },
  { id: 'CA-1004', name: 'Meera Nair', age: 36, gender: 'Female', city: 'Kochi', hospital: 'General Hospital Ernakulam', department: 'Paediatrics', complaint: 'General health consultation', priority: 'Low', status: 'New', date: '2026-10-18' },
  { id: 'CA-1005', name: 'Rahul Patil', age: 47, gender: 'Male', city: 'Pune', hospital: 'Sassoon General Hospital', department: 'General Medicine', complaint: 'Routine follow-up', priority: 'High', status: 'Under Review', date: '2026-10-18' },
];

const departments = ['General Medicine', 'Cardiology', 'Orthopaedics', 'Paediatrics', 'Neurology', 'Emergency'];
const pages = ['Dashboard', 'Patient Cases', 'Create New Case', 'Clinical Review Queue', 'AI Case Summary', 'Analytics', 'Activity Log', 'Settings', 'Help & About'];
const demoEmail = 'demo@caseassist.in';
const demoPassword = 'Demo@123';

const loginCss = `
.auth-screen{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:#f4f7fb;color:#173250;font-family:Inter,Arial,sans-serif}
.auth-brand{display:flex;flex-direction:column;justify-content:center;padding:55px 10%;background:linear-gradient(145deg,#102744,#17677c);color:white}
.auth-logo{display:grid;place-items:center;width:56px;height:56px;border-radius:15px;background:#1b9aa5;font-size:30px}
.auth-brand h1{margin:18px 0 8px;color:white;font-size:36px}
.auth-brand p{line-height:1.8;color:#d2e6ee}
.auth-features{margin:35px 0;line-height:3;color:#e8f5f5}
.auth-brand small{color:#bfd5e0;line-height:1.7}
.auth-side{display:grid;place-items:center;padding:30px 18px}
.auth-card{width:100%;max-width:430px;padding:35px;border:1px solid #e1e8f0;border-radius:17px;background:white;box-shadow:0 15px 45px #17325010}
.auth-kicker{font-size:10px;font-weight:800;letter-spacing:1.5px;color:#168493}
.auth-card h2{margin:12px 0 8px;font-size:26px;color:#173250}
.auth-muted{font-size:13px;line-height:1.7;color:#7a899d;margin-bottom:23px}
.auth-field{display:flex;flex-direction:column;gap:8px;margin:16px 0;color:#405770;font-size:12px;font-weight:700}
.auth-field input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #dce5ee;border-radius:8px;font:inherit;font-weight:400;outline:none}
.auth-field input:focus{border-color:#168493}
.auth-submit{width:100%;padding:14px;margin-top:13px;border:0;border-radius:8px;background:#147e91;color:white;font-weight:700;cursor:pointer}
.auth-switch{text-align:center;margin:19px 0;color:#718197;font-size:12px}
.auth-link{border:0;background:none;color:#147e91;font-weight:800;cursor:pointer}
.auth-error{padding:10px;margin-top:12px;background:#fff0f0;color:#ad3737;border-radius:7px;font-size:12px;line-height:1.6}
.auth-demo{padding:14px;margin-top:20px;background:#f1fafb;border:1px dashed #b9dce2;border-radius:9px;font-size:12px;line-height:1.7;overflow-wrap:anywhere}
.auth-demo p{margin:5px 0;color:#4d687e}
.auth-demo button{margin-top:7px;padding:8px 10px;border:1px solid #c5e1e6;border-radius:6px;background:white;color:#147e91;cursor:pointer}
.auth-note{font-size:10px;color:#8491a3;line-height:1.7;text-align:center;margin-top:18px}
@media(max-width:800px){.auth-screen{grid-template-columns:1fr}.auth-brand{padding:28px}.auth-features{margin:15px 0}.auth-brand h1{font-size:29px}.auth-side{padding:22px 14px}.auth-card{box-sizing:border-box;padding:25px}}
`;

function App() {
 const [user, setUser] = useState<import('firebase/auth').User | null>(auth.currentUser);
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);

    if (!currentUser) {
      sessionStorage.removeItem('caseassist-user');
      setAuthMode('login');
      setMessage('');
    }
  });

  return unsubscribe;
}, []);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [cases, setCases] = useState<PatientCase[]>(() => {
    try {
      const saved = localStorage.getItem('caseassist-cases');
      return saved ? JSON.parse(saved) as PatientCase[] : sampleCases;
    } catch {
      return sampleCases;
    }
  });

  const [page, setPage] = useState('Dashboard');
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [message, setMessage] = useState('');
  const [activities, setActivities] = useState<string[]>(['CaseAssist demo started']);
  const [form, setForm] = useState({
    name: '', age: '25', gender: 'Female', city: 'Bengaluru',
    hospital: 'Victoria Hospital', department: 'General Medicine',
    complaint: '', priority: 'Medium',
  });
  const completenessItems = [
  { label: 'Patient name', complete: !!form.name.trim() },
  { label: 'Age', complete: form.age !== '' && Number(form.age) >= 0 },
  { label: 'Gender', complete: !!form.gender },
  { label: 'City', complete: !!form.city },
  { label: 'Hospital', complete: !!form.hospital },
  { label: 'Department', complete: !!form.department },
  { label: 'Priority', complete: !!form.priority },
  { label: 'Reason for visit', complete: !!form.complaint.trim() },
];

const completedItems = completenessItems.filter(item => item.complete).length;
const completenessScore = Math.round(
  (completedItems / completenessItems.length) * 100
);

  function saveCases(updated: PatientCase[]) {
    setCases(updated);
    try {
      localStorage.setItem('caseassist-cases', JSON.stringify(updated));
    } catch {
      // The app remains usable for this session if browser storage is unavailable.
    }
  }

  function logActivity(text: string) {
    setActivities((old) => [`${new Date().toLocaleString('en-IN')} — ${text}`, ...old]);
  }

  
  async function submitAuth(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setAuthError('');

  try {
    if (authMode === 'signup') {
      if (authName.trim().length < 2) {
        setAuthError('Please enter your full name.');
        return;
      }

      await signUp(authName.trim(), authEmail.trim(), authPassword);
    } else {
      await signIn(authEmail.trim(), authPassword);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed.';
    setAuthError(message);
  }
}
async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    sessionStorage.removeItem('caseassist-user');
    setUser(null);
    setSelectedId('');
    setPage('Dashboard');
    setAuthMode('login');
    setAuthPassword('');
    setAuthError('');
    setMessage('You have been logged out.');
  }
}

  function navigate(next: string) {
    setPage(next);
    setSelectedId('');
    setMessage('');
  }

  function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: PatientCase = {
      ...form,
      id: `CA-${1001 + cases.length}`,
      age: Number(form.age),
      status: 'New',
      date: new Date().toISOString().slice(0, 10),
    };

    saveCases([next, ...cases]);
    logActivity(`Created ${next.id}`);
    setSelectedId(next.id);
    setPage('Patient Cases');
    setMessage(`Created demo case ${next.id}.`);
    setForm({
      name: '', age: '25', gender: 'Female', city: 'Bengaluru',
      hospital: 'Victoria Hospital', department: 'General Medicine',
      complaint: '', priority: 'Medium',
    });
  }

  function updateStatus(item: PatientCase, status: string) {
    saveCases(cases.map((record) => record.id === item.id ? { ...record, status } : record));
    logActivity(`${item.id} status changed to ${status}`);
    setMessage(`${item.id} status changed to ${status}.`);
  }

  function deleteCase(item: PatientCase) {
    if (!window.confirm(`Delete demo case ${item.id}?`)) return;
    saveCases(cases.filter((record) => record.id !== item.id));
    logActivity(`Deleted ${item.id}`);
    setSelectedId('');
    setMessage(`Deleted ${item.id}.`);
  }

  const selectedCase = cases.find((item) => item.id === selectedId);
  const newCount = cases.filter((item) => item.status === 'New').length;
  const reviewCount = cases.filter((item) => item.status === 'Under Review').length;
  const completedCount = cases.filter((item) => item.status === 'Completed').length;
  const highCount = cases.filter((item) => item.priority === 'High').length;

  const filteredCases = cases.filter((item) => {
    const searchText = `${item.id} ${item.name} ${item.city} ${item.hospital} ${item.department}`.toLowerCase();
    return searchText.includes(search.toLowerCase())
      && (statusFilter === 'All' || item.status === statusFilter)
      && (departmentFilter === 'All' || item.department === departmentFilter);
  });

  if (!user) {
    return (
      <>
        <style>{loginCss}</style>
        <main className="auth-screen">
          <section className="auth-brand">
            <div className="auth-logo">✚</div>
            <h1>CaseAssist</h1>
            <p>Smart Patient Information &amp; Case Management</p>
            <div className="auth-features">
              <div>✓ &nbsp; Organised case management</div>
              <div>✓ &nbsp; Patient workflow tracking</div>
              <div>✓ &nbsp; Healthcare analytics</div>
              <div>✓ &nbsp; Indian healthcare workflow</div>
            </div>
            <small>Student project prototype · Fictional sample data only</small>
          </section>

          <section className="auth-side">
            <form className="auth-card" onSubmit={submitAuth}>
              <div className="auth-kicker">WELCOME TO CASEASSIST</div>
              <h2>{authMode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
              <p className="auth-muted">
                {authMode === 'login'
                  ? 'Enter your credentials to access the dashboard.'
                  : 'Create an account to preview the registration process.'}
              </p>

              {authMode === 'signup' && (
                <label className="auth-field">
                  Full name
                  <input required value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Enter your full name" />
                </label>
              )}

              <label className="auth-field">
                Email address
                <input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" />
              </label>

              <label className="auth-field">
                Password
                <input required type="password" minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
              </label>

              {authError && <div className="auth-error">{authError}</div>}

              <button className="auth-submit" type="submit">
                {authMode === 'login' ? 'Sign In →' : 'Sign Up →'}
              </button>

              <div className="auth-switch">
                {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button className="auth-link" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}>
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>

              <div className="auth-demo">
                <strong>Demo Login Credentials</strong>
                <p>Email: {demoEmail}</p>
                <p>Password: {demoPassword}</p>
                <button type="button" onClick={() => { setAuthEmail(demoEmail); setAuthPassword(demoPassword); setAuthMode('login'); setAuthError(''); }}>
                  Use Demo Account
                </button>
              </div>

              <p className="auth-note">
                Demo authentication only. Sign-up is a preview; real accounts require Firebase Authentication.
                Do not enter real patient data.
              </p>
            </form>
          </section>
        </main>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✚</div>
          <div>CaseAssist<small style={{ display: 'block', fontSize: 10, fontWeight: 500 }}>SMART HEALTHCARE</small></div>
        </div>

        <div className="nav-caption">MAIN MENU</div>
        <nav>
          {pages.map((item, index) => (
            <button key={item} className={`nav-item ${page === item ? 'active' : ''}`} onClick={() => navigate(item)}>
              <span className="nav-icon">{['▦', '▤', '+', '◷', '✧', '▥', '◴', '⚙', '?'][index]}</span>
              <span>{item}</span>
              {item === 'Clinical Review Queue' && reviewCount > 0 && <span className="nav-count">{reviewCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="india-badge">🇮🇳 Indian Healthcare Workflow<br />Student project · Demo data</div>
          <div className="profile">
            <div className="avatar">{(user?.email ?? 'U').slice(0, 1).toUpperCase()}</div>
            <div style={{ overflowWrap: 'anywhere' }}>{user.email ?? 'User'}<small style={{ display: 'block', marginTop: 4 }}>Demo session</small></div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span>CaseAssist / {selectedCase ? 'Case Details' : page}</span>
          <div className="topbar-right">
            <span className="demo-label">DEMO MODE</span>
            <button className="secondary-button" onClick={logout}>Logout</button>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">PATIENT INFORMATION &amp; CASE MANAGEMENT</div>
              <h1>{page === 'Dashboard' ? 'Good day, Administrator 👋' : selectedCase ? 'Patient Case Details' : page}</h1>
              <p className="subtitle">Manage sample patient records and healthcare case workflows in one place.</p>
            </div>
            <div className="date-chip">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>

          <div className="notice"><strong>Demo environment:</strong> All patient details are fictional. Do not enter real patient information. This prototype is not for clinical use.</div>
          {message && <div className="notice">{message}</div>}

          {page === 'Dashboard' && !selectedCase && (
            <>
              <div className="banner">
                <div className="banner-symbol">✚</div>
                <div><h2>Better organised care starts here</h2><p>Track cases, organise reviews and explore healthcare workflow data.</p></div>
                <button className="banner-button" onClick={() => navigate('Create New Case')}>+ Create New Case</button>
              </div>
              <div className="stats-grid">
                <StatCard icon="▤" color="blue" label="Total Cases" value={cases.length} note="Registered demo records" />
                <StatCard icon="◷" color="orange" label="Awaiting Review" value={reviewCount} note="Under review" />
                <StatCard icon="✓" color="green" label="Completed Cases" value={completedCount} note="Marked completed" />
                <StatCard icon="✚" color="teal" label="High Priority" value={highCount} note="Priority label only" />
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <PanelHeading title="Case Status Overview" subtitle="Current case distribution" />
                  <div className="status-content">
                    <div className="donut" style={{ background: `conic-gradient(#168c9b 0 ${cases.length ? newCount / cases.length * 100 : 0}%, #4674d5 ${cases.length ? newCount / cases.length * 100 : 0}% ${cases.length ? (newCount + reviewCount) / cases.length * 100 : 0}%, #35a66d ${cases.length ? (newCount + reviewCount) / cases.length * 100 : 0}% 100%)` }}>
                      <div className="donut-center">{cases.length}<span>Total cases</span></div>
                    </div>
                    <div className="legend">
                      <Legend color="#168c9b" label="New" value={newCount} />
                      <Legend color="#4674d5" label="Under Review" value={reviewCount} />
                      <Legend color="#35a66d" label="Completed" value={completedCount} />
                    </div>
                  </div>
                </section>
                <section className="panel">
                  <PanelHeading title="Cases by Department" subtitle="Sample case distribution" />
                  {departments.map((department) => {
                    const count = cases.filter((item) => item.department === department).length;
                    if (!count) return null;
                    return <div className="bar-row" key={department}><div className="bar-label">{department}</div><div className="bar-track"><div className="bar-fill" style={{ width: `${count / Math.max(1, cases.length) * 100}%` }} /></div><strong>{count}</strong></div>;
                  })}
                </section>
              </div>
              <section className="panel recent-panel">
                <div className="panel-heading-row"><div><h2>Recent Patient Cases</h2><p className="subtitle">Latest sample records</p></div><button className="text-button" onClick={() => navigate('Patient Cases')}>View all →</button></div>
                <CaseTable cases={cases.slice(0, 5)} onSelect={(item) => setSelectedId(item.id)} />
              </section>
            </>
          )}

          {page === 'Patient Cases' && !selectedCase && (
            <section className="panel cases-panel">
              <div className="panel-heading-row"><div><h2>All Patient Cases</h2><p className="subtitle">{filteredCases.length} matching records</p></div><button className="primary-button" onClick={() => navigate('Create New Case')}>+ New Case</button></div>
              <div className="filters">
                <input placeholder="Search name, ID, hospital or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{['All', 'New', 'Under Review', 'Completed'].map((v) => <option key={v}>{v}</option>)}</select>
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}><option>All</option>{departments.map((v) => <option key={v}>{v}</option>)}</select>
              </div>
              <CaseTable cases={filteredCases} onSelect={(item) => setSelectedId(item.id)} />
            </section>
          )}

          {page === 'Create New Case' && (
            <section className="panel form-panel">
              <PanelHeading title="Register a Patient Case" subtitle="Use fictional sample details only." />
              <form onSubmit={createCase}>
                <div className="form-section-title">Patient Information</div>
                <div className="form-grid">
                  <Field label="Patient name"><input required maxLength={80} placeholder="Fictional name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                  <Field label="Age"><input type="number" required min="0" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
                  <Field label="Gender"><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></Field>
                  <Field label="City"><select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>{['Bengaluru', 'Hyderabad', 'Chennai', 'Kochi', 'Pune', 'Mysuru', 'Mumbai', 'Delhi'].map((v) => <option key={v}>{v}</option>)}</select></Field>
                  <Field label="Hospital"><select value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}>{['Victoria Hospital', 'Osmania General Hospital', 'Rajiv Gandhi Government General Hospital', 'General Hospital Ernakulam', 'Sassoon General Hospital', 'District Government Hospital'].map((v) => <option key={v}>{v}</option>)}</select></Field>
                  <Field label="Department"><select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>{departments.map((v) => <option key={v}>{v}</option>)}</select></Field>
                  <Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></Field>
                  <Field label="Reason for visit"><input required maxLength={250} placeholder="Example: routine follow-up" value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} /></Field>
                </div>
                <div className="form-note">
  <h3>Case Completeness Score: {completenessScore}%</h3>
  <div style={{
    height: '10px',
    background: '#e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    margin: '8px 0'
  }}>
    <div style={{
      width: `${completenessScore}%`,
      height: '100%',
      background: '#0d9488'
    }} />
  </div>
  <p>{completedItems} of {completenessItems.length} fields completed.</p>
  <ul>
    {completenessItems.map(item => (
      <li key={item.label}>
        {item.complete ? '✓' : '○'} {item.label}
      </li>
    ))}
  </ul>
</div>

<div className="form-note">
  <h3>Patient Memory Prompts</h3>
  <p>Ask the patient these questions to help recall important information:</p>
  <ul>
    <li>When did your symptoms start?</li>
    <li>What medicines are you currently taking, including doses?</li>
    <li>Do you have any known allergies?</li>
    <li>Have you had previous illnesses or surgeries?</li>
    <li>Is there any relevant family medical history?</li>
  </ul>
  <p>Record only details the patient confirms.</p>
</div>
                <p className="form-note">Demo records are saved in this browser only.</p>
                <div className="form-actions"><button className="primary-button" type="submit">Create Case</button><button className="secondary-button" type="button" onClick={() => navigate('Dashboard')}>Cancel</button></div>
              </form>
            </section>
          )}

          {page === 'Clinical Review Queue' && !selectedCase && <section className="panel"><PanelHeading title="Clinical Review Queue" subtitle="Demo cases marked Under Review" /><CaseTable cases={cases.filter((item) => item.status === 'Under Review')} onSelect={(item) => setSelectedId(item.id)} /></section>}

          {page === 'AI Case Summary' && !selectedCase && <section className="panel"><PanelHeading title="AI-Assisted Case Summary" subtitle="Preview of a future AI feature" /><div className="ai-notice">AI is not connected. This screen does not generate medical advice.</div>{cases.map((item) => <div className="activity-item" key={item.id}><div className="activity-dot" /><div className="activity-text"><strong>{item.name} · {item.id}</strong><p>{item.department} — {item.complaint}</p><button className="text-button" onClick={() => setSelectedId(item.id)}>View case →</button></div></div>)}</section>}

          {page === 'Analytics' && <><div className="stats-grid"><StatCard icon="▤" color="blue" label="Total Cases" value={cases.length} note="All demo records" /><StatCard icon="◷" color="orange" label="In Progress" value={newCount + reviewCount} note="New or under review" /><StatCard icon="✓" color="green" label="Completed" value={completedCount} note="Completed records" /><StatCard icon="✚" color="teal" label="High Priority" value={highCount} note="Priority label only" /></div><section className="panel"><PanelHeading title="Department Analytics" subtitle="Counts based on current records" />{departments.map((department) => { const count = cases.filter((item) => item.department === department).length; return <div className="bar-row" key={department}><div className="bar-label">{department}</div><div className="bar-track"><div className="bar-fill" style={{ width: `${count / Math.max(1, cases.length) * 100}%` }} /></div><strong>{count}</strong></div>; })}</section></>}

          {page === 'Activity Log' && <section className="panel"><PanelHeading title="Activity Log" subtitle="Actions recorded during this session" /><div className="activity-list">{activities.map((activity, index) => <div className="activity-item" key={`${activity}-${index}`}><div className="activity-dot" /><div className="activity-text">{activity}</div></div>)}</div><p className="form-note">This is a basic demo log, not a secure audit trail.</p></section>}

          {page === 'Settings' && <section className="panel"><PanelHeading title="Settings" subtitle="Prototype configuration" /><div className="setting-row"><span>Application</span><span className="setting-tag">CaseAssist Demo</span></div><div className="setting-row"><span>Data storage</span><span className="setting-tag">Browser only</span></div><div className="setting-row"><span>Firebase / Cloud</span><span className="setting-tag">Not connected</span></div><div className="setting-row"><span>AI integration</span><span className="setting-tag">Not connected</span></div><div className="form-actions"><button className="secondary-button" onClick={() => { if (window.confirm('Restore fictional sample cases?')) { saveCases(sampleCases); setMessage('Sample cases restored.'); logActivity('Restored sample cases'); } }}>Restore Sample Data</button></div></section>}

          {page === 'Help & About' && <section className="panel"><PanelHeading title="Help & About CaseAssist" subtitle="Student project prototype" /><HelpCard title="Dashboard" text="View case totals, statuses and department statistics." /><HelpCard title="Patient Cases" text="Search, filter and open sample patient records." /><HelpCard title="Create New Case" text="Add fictional case records to demonstrate the workflow." /><HelpCard title="AI Case Summary" text="Preview for a future AI integration; no AI is connected." /><div className="disclaimer">Educational prototype only. Not an electronic health record system or a substitute for professional clinical judgement.</div></section>}

          {selectedCase && <section className="panel"><button className="back-button" onClick={() => setSelectedId('')}>← Back</button><div className="patient-header"><div className="patient-avatar">{selectedCase.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div className="patient-heading"><h2>{selectedCase.name}</h2><p>{selectedCase.id} · {selectedCase.age} years · {selectedCase.gender}</p></div><span className={`status-badge ${selectedCase.status.toLowerCase().replaceAll(' ', '-')}`}>{selectedCase.status}</span></div><div className="form-grid"><Detail label="City" value={selectedCase.city} /><Detail label="Hospital" value={selectedCase.hospital} /><Detail label="Department" value={selectedCase.department} /><Detail label="Registration Date" value={selectedCase.date} /><Detail label="Priority" value={selectedCase.priority} /><Detail label="Reason for visit" value={selectedCase.complaint} /></div><div className="form-section-title">Update Case Status</div><div className="form-actions"><button className="secondary-button" onClick={() => updateStatus(selectedCase, 'New')}>Mark New</button><button className="secondary-button" onClick={() => updateStatus(selectedCase, 'Under Review')}>Mark Under Review</button><button className="primary-button" onClick={() => updateStatus(selectedCase, 'Completed')}>Mark Completed</button><button className="delete-button" onClick={() => deleteCase(selectedCase)}>Delete Demo Case</button></div></section>}

          <footer className="footer">CaseAssist · Indian Healthcare Workflow · Student Project Prototype<br />Fictional data only · Not for clinical use</footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, color, label, value, note }: { icon: string; color: string; label: string; value: number; note: string }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

function PanelHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>;
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return <div className="legend-row"><span className="legend-dot" style={{ background: color }} /><span>{label}</span><strong style={{ marginLeft: 'auto' }}>{value}</strong></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field">{label}{children}</label>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="field"><span>{label}</span><div style={{ color: '#26435f', fontWeight: 500 }}>{value}</div></div>;
}

function HelpCard({ title, text }: { title: string; text: string }) {
  return <div className="help-card"><h3>{title}</h3><p>{text}</p></div>;
}

function CaseTable({ cases, onSelect }: { cases: PatientCase[]; onSelect: (item: PatientCase) => void }) {
  if (!cases.length) return <div className="empty-state">No cases to display.</div>;
  return <div className="table-wrap"><table><thead><tr><th>Patient / ID</th><th>Hospital / City</th><th>Department</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead><tbody>{cases.map((item) => <tr key={item.id}><td><div className="table-person"><div className="mini-avatar">{item.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div>{item.name}<div className="muted">{item.id}</div></div></div></td><td><div className="hospital-cell">{item.hospital}</div><div className="muted">{item.city}</div></td><td>{item.department}</td><td><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span></td><td><span className={`status-badge ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span></td><td><button className="view-button" onClick={() => onSelect(item)}>View →</button></td></tr>)}</tbody></table></div>;
}

export default App;