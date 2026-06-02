import { useState, useEffect } from 'react'

function App() {
  const [apiStatus, setApiStatus] = useState('Pinging core system...')
  const [rulData, setRulData] = useState(null)
  const [anomalyData, setAnomalyData] = useState(null)
  const [isRulLoading, setIsRulLoading] = useState(false)
  const [isAnomalyLoading, setIsAnomalyLoading] = useState(false)
  
  // New States for UI Polish
  const [activeTab, setActiveTab] = useState('dashboard')
  const [saveText, setSaveText] = useState('Save Key')
  const [groqKey, setGroqKey] = useState(localStorage.getItem('sentinel_groq_key') || '')

  const [forecastData, setForecastData] = useState(null)
  const [isForecastLoading, setIsForecastLoading] = useState(false)

  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(() => setApiStatus('Connected'))
      .catch(() => setApiStatus('Offline'))
  }, [])

  const handleKeySave = () => {
    localStorage.setItem('sentinel_groq_key', groqKey);
    setSaveText('Saved! ✓');
    setTimeout(() => setSaveText('Save Key'), 2000);
  }

  // --- API HANDLERS ---
  const handleRulDiagnostic = async () => {
    setIsRulLoading(true)
    const mockSensors = Array.from({ length: 24 }, () => Math.random() * 100)
    try {
      const res = await fetch('http://localhost:8000/predict-rul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: "TURBOFAN_ENG_08", features: mockSensors, groq_key: groqKey })
      })
      const data = await res.json()
      setRulData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsRulLoading(false)
    }
  }

  const handleEnergyForecast = async () => {
    setIsForecastLoading(true)
    const mockEnergySensors = Array.from({ length: 25 }, () => Math.random() * 50)
    try {
      const res = await fetch('http://localhost:8000/forecast-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: "FACILITY_GRID_01", features: mockEnergySensors, groq_key: groqKey })
      })
      const data = await res.json()
      setForecastData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsForecastLoading(false)
    }
  }

  const handleAnomalyScan = async () => {
    setIsAnomalyLoading(true)
    const mockEnergySensors = Array.from({ length: 26 }, () => Math.random() * 50)
    try {
      const res = await fetch('http://localhost:8000/detect-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: "FACILITY_GRID_01", features: mockEnergySensors, groq_key: groqKey })
      })
      const data = await res.json()
      setAnomalyData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnomalyLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: '#374151' }}>
      
      {/* --- STICKY NAVIGATION HEADER --- */}
      <nav style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E5E7EB', zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#FF7A45', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>SentinelML</span>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
            <a href="#about" onClick={() => setActiveTab('about')} style={{ color: activeTab === 'about' ? '#111827' : '#6B7280', fontWeight: activeTab === 'about' ? '700' : '500', textDecoration: 'none' }}>About</a>
            <a href="#setup" onClick={() => setActiveTab('setup')} style={{ color: activeTab === 'setup' ? '#111827' : '#6B7280', fontWeight: activeTab === 'setup' ? '700' : '500', textDecoration: 'none' }}>Configuration</a>
            <a href="#dashboard" onClick={() => setActiveTab('dashboard')} style={{ color: activeTab === 'dashboard' ? '#111827' : '#6B7280', fontWeight: activeTab === 'dashboard' ? '700' : '500', textDecoration: 'none' }}>Live Dashboard</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: apiStatus === 'Connected' ? '#22C55E' : '#EF4444' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: apiStatus === 'Connected' ? '#111827' : '#EF4444', textTransform: 'uppercase' }}>
              {apiStatus}
            </span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* --- HERO SECTION --- */}
        <section id="about" style={{ padding: '80px 0', textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>
          {/* FIX: Added lineHeight to prevent overlapping */}
          <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#111827', marginBottom: '16px', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
            Industrial Intelligence & <br/><span style={{ color: '#FF7A45' }}>Predictive Analytics</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
            SentinelML bridges the gap between raw hardware telemetry and actionable insights. By combining Scikit-Learn isolation forests with Agentic LLM reasoning, we prevent downtime before it happens.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a href="#dashboard" onClick={() => setActiveTab('dashboard')} style={{ backgroundColor: '#292929', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500' }}>Launch Dashboard</a>
            <a href="#setup" onClick={() => setActiveTab('setup')} style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500' }}>Configure API</a>
          </div>
        </section>

        {/* --- SETUP SECTION --- */}
        <section id="setup" style={{ padding: '60px 0', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#F9FAFB', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginTop: 0 }}>Agentic AI Configuration</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              SentinelML uses Groq's lightning-fast inference to generate human-readable diagnostic reports when an anomaly is detected.
            </p>
            
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>Groq API Key</label>
            
            {/* FIX: Added flexbox to put input and button side-by-side */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="password" 
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
              />
              <button 
                onClick={handleKeySave}
                style={{ backgroundColor: saveText === 'Saved! ✓' ? '#22C55E' : '#292929', color: 'white', border: 'none', borderRadius: '6px', padding: '0 20px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s' }}
              >
                {saveText}
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', textAlign: 'left' }}>
              Don't have an API key? Get one for free at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: '#FF7A45', textDecoration: 'none' }}>console.groq.com/keys</a>. Your key is stored securely in your browser's local storage.
            </p>
          </div>
        </section>

        {/* --- DASHBOARD SECTION --- */}
        <section id="dashboard" style={{ padding: '60px 0 100px 0' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Live Telemetry Dashboard</h2>
            <p style={{ color: '#6B7280', marginTop: '4px' }}>Monitor facility grid health and predict engine RUL cycles.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            
            {/* Card 1: Predictive Maintenance */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: 0 }}>Predictive Maintenance</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5', marginBottom: '24px' }}>
                Evaluate continuous aerospace turbofan data matrix arrays to compute exact machine cycle depletion counts.
              </p>
              
              <button onClick={handleRulDiagnostic} disabled={isRulLoading || !groqKey}
                style={{ backgroundColor: '#292929', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '10px 16px', fontWeight: '500', cursor: (!groqKey || isRulLoading) ? 'not-allowed' : 'pointer', opacity: (!groqKey || isRulLoading) ? 0.7 : 1 }}>
                {isRulLoading ? 'Processing Telemetry...' : 'Execute Diagnostic Run'}
              </button>

              {!groqKey && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>Please configure Groq API Key above to run diagnostics.</p>}

              {rulData && (
                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB', borderLeft: rulData.status === 'Healthy' ? '4px solid #22C55E' : '4px solid #EF4444' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Asset:</strong> {rulData.machine_id}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Est. RUL:</strong> {rulData.estimated_rul} Cycles</p>
                  <p style={{ margin: 0, fontSize: '14px' }}><strong>Status:</strong> {rulData.status}</p>
                  {rulData.ai_summary && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', fontSize: '13px', color: '#374151' }}>
                      <strong>AI Agent Diagnosis:</strong> <br/> {rulData.ai_summary}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: Anomaly Detection */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: 0 }}>Multivariate Isolation Engine</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5', marginBottom: '24px' }}>
                Perform live multi-stream evaluation of infrastructure thermodynamic profiles and energy draw lines.
              </p>
              
              <button onClick={handleAnomalyScan} disabled={isAnomalyLoading || !groqKey}
                style={{ backgroundColor: '#FF7A45', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '10px 16px', fontWeight: '500', cursor: (!groqKey || isAnomalyLoading) ? 'not-allowed' : 'pointer', opacity: (!groqKey || isAnomalyLoading) ? 0.7 : 1 }}>
                {isAnomalyLoading ? 'Parsing Multi-Stream...' : 'Trigger Isolation Scan'}
              </button>

              {!groqKey && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>Please configure Groq API Key above to run scans.</p>}

              {anomalyData && (
                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB', borderLeft: anomalyData.anomaly_detected ? '4px solid #EF4444' : '4px solid #22C55E' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Grid:</strong> {anomalyData.machine_id}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Signal:</strong> {anomalyData.status}</p>
                  {anomalyData.ai_summary && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', fontSize: '13px', color: '#374151' }}>
                      <strong>AI Agent Diagnosis:</strong> <br/> {anomalyData.ai_summary}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 3: Energy Forecasting */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: 0 }}>Demand Forecasting</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5', marginBottom: '24px' }}>
                Utilize LightGBM gradient boosting to predict short-term aggregate facility energy consumption.
              </p>
              
              <button onClick={handleEnergyForecast} disabled={isForecastLoading || !groqKey}
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '10px 16px', fontWeight: '500', cursor: (!groqKey || isForecastLoading) ? 'not-allowed' : 'pointer', opacity: (!groqKey || isForecastLoading) ? 0.7 : 1 }}>
                {isForecastLoading ? 'Calculating Load...' : 'Generate Forecast'}
              </button>

              {!groqKey && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>Please configure Groq API Key above.</p>}

              {forecastData && (
                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB', borderLeft: '4px solid #3B82F6' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Target:</strong> {forecastData.machine_id}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Predicted Load:</strong> {forecastData.forecasted_wh} Wh</p>
                  {forecastData.ai_summary && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', fontSize: '13px', color: '#374151' }}>
                      <strong>AI Agent Strategy:</strong> <br/> {forecastData.ai_summary}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}

export default App