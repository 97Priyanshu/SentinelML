import { useState, useEffect } from 'react'

function App() {
  const [apiStatus, setApiStatus] = useState('pinging backend...')

  // fire once on mount to check if fastapi is awake
  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => {
        setApiStatus(data.status)
      })
      .catch(err => {
        console.error(err)
        setApiStatus('offline (is uvicorn running?)')
      })
  }, [])

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Industrial Monitor Dashboard</h1>
      
      <div style={{ 
        padding: '1rem', 
        background: '#f4f4f4', 
        borderRadius: '8px',
        borderLeft: apiStatus === 'System Online' ? '4px solid green' : '4px solid red'
      }}>
        <p style={{ margin: 0 }}>
          API Connection: <strong>{apiStatus}</strong>
        </p>
      </div>
      
      {/* TODO: map out the actual sensor charts here later */}
    </div>
  )
}

export default App