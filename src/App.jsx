import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DriverEntry from './pages/DriverEntry';
import './index.css';
import InstallPrompt from './components/InstallPrompt';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: 'red' }}>
          <h1>เกิดข้อผิดพลาดในการโหลดระบบ</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Upgrade legacy hash routing to clean URLs
  if (window.location.hash.includes('admin')) {
    window.location.replace('/admin');
    return null;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<DriverEntry />} />
          <Route path="/index.html" element={<DriverEntry />} />
          <Route path="/driver" element={<DriverEntry />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin.html" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallPrompt />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
