import './App.css';
import { useState } from 'react';
import FlowMindRoadmap from './flowChart';
import SynapseTutorRoadmap from './synapse_tutor_road_map';

function App() {
  const [active, setActive] = useState(null);

  if (active === 'flowmind') {
    return (
      <div className="App">
        <div className="app-shell">
          <button className="back-button" onClick={() => setActive(null)}>
            ← Back to classroom cards
          </button>
          <FlowMindRoadmap />
        </div>
      </div>
    );
  }

  if (active === 'synapse') {
    return (
      <div className="App">
        <div className="app-shell">
          <button className="back-button" onClick={() => setActive(null)}>
            ← Back to classroom cards
          </button>
          <SynapseTutorRoadmap />
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-shell card-grid-page">
        <div className="hero-card">
          <div>
            <p className="hero-pill">Classroom AI Launcher</p>
            <h1>Choose your learning roadmap</h1>
            <p className="hero-subtext">Pick FlowMind for engineering workflow roadmap, or Synapse Tutor for system design and AI teaching curriculum.</p>
          </div>
        </div>

        <div className="card-grid">
          <button className="class-card" onClick={() => setActive('flowmind')}>
            <div className="card-header">
              <div className="card-icon">🧭</div>
              <div>
                <div className="card-title">FlowMind Roadmap</div>
                <div className="card-subtitle">AI workflow platform build plan</div>
              </div>
            </div>
            <p className="card-text">12-week production engineering roadmap for building enterprise AI orchestration with microservices, Kafka, and AI agents.</p>
            <div className="card-footer">Start FlowMind →</div>
          </button>

          <button className="class-card" onClick={() => setActive('synapse')}>
            <div className="card-header">
              <div className="card-icon">🧠</div>
              <div>
                <div className="card-title">Synapse Tutor Roadmap</div>
                <div className="card-subtitle">AI tutoring system design curriculum</div>
              </div>
            </div>
            <p className="card-text">Build a classroom AI multi-agent learning system with Spring Boot, RAG, code evaluation, and voice tutoring in a guided curriculum.</p>
            <div className="card-footer">Start Synapse →</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
