import React, { useState } from "react";
import { ShieldCheck, Github, Linkedin } from "lucide-react";

function DeveloperAvatar({ username, initials }) {
  const [error, setError] = useState(false);

  if (error || !username) {
    return <div className="developer-avatar-container">{initials}</div>;
  }

  return (
    <img 
      src={`https://github.com/${username}.png`} 
      alt={initials} 
      className="developer-avatar-img"
      onError={() => setError(true)}
    />
  );
}

export default function AboutPage() {
  return (
    <div className="page-shell about-container" data-testid="about-page">
      {/* Developers Section */}
      <div className="developers-section" style={{ marginTop: 0 }}>
        <div className="overline" style={{ marginBottom: 8 }}>◉ The Developers</div>
        <div className="developer-grid">
          {/* Developer Card: Tanmay Sawankar */}
          <div className="developer-card">
            <DeveloperAvatar username="TanmaySawankar390" initials="TS" />
            <div className="developer-name">Tanmay Sawankar</div>
            <div className="developer-title">Frontend Architect &amp; Systems Engineer</div>
            <div className="developer-bio">
              Architecting fluid, high performance visual interfaces and real time mapping dashboards to put insights directly into officers' hands.
            </div>
            <div className="developer-socials">
              <a href="https://github.com/TanmaySawankar390" className="developer-social-btn" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <Github size={16} />
              </a>
              <a href="https://www.linkedin.com/in/tanmay-sawankar-57a945223" className="developer-social-btn" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Developer Card: Pratham Sharma */}
          <div className="developer-card">
            <DeveloperAvatar username="PrathamSharma169" initials="PS" />
            <div className="developer-name">Pratham Sharma</div>
            <div className="developer-title">Backend Architect &amp; Data Scientist</div>
            <div className="developer-bio">
              Designing robust API structures and spatial clustering engines to transform raw traffic statistics into actionable street intelligence.
            </div>
            <div className="developer-socials">
              <a href="https://github.com/PrathamSharma169" className="developer-social-btn" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <Github size={16} />
              </a>
              <a href="https://www.linkedin.com/in/pratham-sharma-9a5307251/" className="developer-social-btn" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Mission Banner */}
      <div style={{ 
        overflow: "hidden", 
        borderRadius: "var(--r-lg)", 
        border: "1px solid var(--border)", 
        boxShadow: "var(--shadow-md)",
        marginTop: 48,
        marginBottom: 40,
        background: "var(--bg-paper)"
      }}>
        <img 
          src="/about.png" 
          alt="Namma Bengaluru: Keeping the city breathing and moving" 
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* Advisory Note */}
      <div style={{
        marginTop: 48, padding: "20px 24px",
        background: "var(--primary-dark)", color: "var(--text-on-dark)",
        borderRadius: "var(--r-lg)",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "var(--shadow-md)"
      }}>
        <ShieldCheck size={24} color="var(--auto-yellow)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
          For the Bengaluru City Traffic Police only. The recommendations on this console
          are advisory — final dispatch decisions remain with the officer on duty.
        </div>
      </div>
    </div>
  );
}
