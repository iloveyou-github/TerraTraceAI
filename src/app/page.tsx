// Must stay on line 1! Marks the component as client-side
'use client';

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

// ========== All configuration read from .env.local - zero hardcoding ==========
const TRIO_API_URL = process.env.NEXT_PUBLIC_TRIO_API_URL || "";
const TRIO_API_KEY = process.env.NEXT_PUBLIC_TRIO_API_KEY || "";
const DETECT_PROMPT = process.env.NEXT_PUBLIC_TRIO_DETECT_PROMPT || "Is there an animated character visible?";
// ==============================================================================

// YouTube Video ID extraction utility
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Trio API Detection Result Type Definition
interface DetectResult {
  triggered: boolean;
  explanation: string;
  latency_ms: number;
}

export default function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  // Resolve Promise-based searchParams (Next.js official requirement)
  const resolvedSearchParams = React.use(searchParams);
  const isPreview = resolvedSearchParams.preview === "true";

  // Trio AI Real-time Analysis State
  const [aiStatus, setAiStatus] = useState<"running" | "warning" | "alert">("running");
  const [activeAlerts, setActiveAlerts] = useState(0);

  // YouTube Video Playback State
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [errorTip, setErrorTip] = useState<string>('');

  // Trio API Polling Detection Core State
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [detectLoading, setDetectLoading] = useState<boolean>(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== Core: Trio Official API Call Function ====================
  const handleDetect = async () => {
    // Basic validation 1: No valid URL, do not execute detection
    const trimedUrl = youtubeUrl.trim();
    if (!trimedUrl || !getYoutubeVideoId(trimedUrl)) {
      setErrorTip("Please load a valid YouTube video before running detection");
      return;
    }

    // Basic validation 2: Missing environment variable configuration prompt
    if (!TRIO_API_URL || !TRIO_API_KEY) {
      setErrorTip("Invalid environment configuration. Check .env.local file and restart the project");
      return;
    }

    setDetectLoading(true);
    setErrorTip('');

    try {
      // Call Trio official API, all configuration from .env.local environment variables
      const response = await fetch(TRIO_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TRIO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stream_url: trimedUrl, // Reads URL from user input field
          condition: DETECT_PROMPT
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Detection successful: save results
        setDetectResult(result);
        // Auto-linked alert: Automatically trigger page alert state when condition is met
        if (result.triggered) {
          setAiStatus("alert");
          setActiveAlerts(prev => prev + 1);
        }
      } else {
        throw new Error(result.error?.message || "Trio API call failed");
      }
    } catch (err) {
      // Error handling
      const errorMsg = err instanceof Error ? err.message : "Detection request failed, please try again";
      setErrorTip(errorMsg);
    } finally {
      setDetectLoading(false);
    }
  };

  // ==================== Auto-detection every 60 seconds core logic ====================
  useEffect(() => {
    // Start polling only when valid video ID exists and environment configuration is valid
    if (videoId && youtubeUrl.trim() && TRIO_API_URL && TRIO_API_KEY) {
      // Run detection immediately on load
      handleDetect();
      // Set to run once every minute (60 * 1000 milliseconds)
      pollTimerRef.current = setInterval(() => {
        handleDetect();
      }, 60 * 1000);
    } else {
      // Clear polling when no valid video / invalid configuration
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    // Clear timer on component unmount / dependency change to prevent memory leaks
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [videoId, youtubeUrl]); // Reset polling when video ID/URL changes

  // Load video function
  const loadVideo = () => {
    setErrorTip('');
    setDetectResult(null);
    const targetVideoId = getYoutubeVideoId(youtubeUrl.trim());
    
    if (!targetVideoId) {
      setErrorTip("Invalid link, please enter a valid YouTube video URL");
      setVideoId(null);
      return;
    }

    setVideoId(targetVideoId);
  };

  // Simulate Trio AI alert trigger
  const triggerMockAlert = () => {
    setAiStatus("alert");
    setActiveAlerts(1);
  };

  // Reset simulation state
  const resetStatus = () => {
    setAiStatus("running");
    setActiveAlerts(0);
    setDetectResult(null);
  };

  return (
    <>
      {/* Global responsive styles - React inline styles do not support @media, this is the only compliant method */}
      <style jsx global>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        @media (min-width: 1024px) {
          .main-grid {
            grid-template-columns: 2fr 1fr;
          }
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (min-width: 768px) {
          .health-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <main style={mainStyle}>
        {/* Top Navigation Bar */}
        <header style={headerStyle}>
          <div style={logoStyle}>
            <span style={greenTextStyle}>TERRA</span> TRACE <span style={sandTextStyle}>AI</span>
          </div>
          <div style={navGroupStyle}>
            <Link href="/" style={navLinkStyle}>Home</Link>
            <Link href="/field-ranger" style={navLinkStyle}>Ranger Portal</Link>
            <Link href="/cost-monitor" style={navLinkStyle}>Cost Monitor</Link>
          </div>
          {isPreview && (
            <div style={previewBadgeStyle}>GUEST PREVIEW MODE</div>
          )}
        </header>

        {/* Trio AI Linked Status Bar */}
        <div style={{
          ...trioStatusBarStyle,
          backgroundColor: aiStatus === "running" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          borderColor: aiStatus === "running" ? "#10b981" : "#ef4444",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: aiStatus === "running" ? "#10b981" : "#ef4444",
              animation: "pulse 1.5s infinite",
            }} />
            <span style={{ fontWeight: 600 }}>
              Trio AI Vision Engine: {aiStatus === "running" ? "LIVE INFERENCE" : "ALERT TRIGGERED"}
            </span>
          </div>
          <span>Model: Wildlife Conservation Specialized | Inference Latency: 42ms</span>
        </div>

        {/* Core Content Area */}
        <div style={contentWrapperStyle}>
          {/* Page Title */}
          <div style={pageTitleStyle}>
            <h1 style={titleStyle}>AI Command Center</h1>
            <p style={subtitleStyle}>Real-Time Wildlife Habitat Monitoring & Threat Alerting | Powered by Trio AI Vision</p>
          </div>

          {/* Status Overview Cards */}
          <div className="stats-grid">
            <div style={{ ...statCardStyle, borderLeft: "4px solid #10b981" }}>
              <h3 style={statNumberStyle}>8</h3>
              <p style={statLabelStyle}>Online Monitoring Zones</p>
            </div>
            <div style={{ ...statCardStyle, borderLeft: "4px solid #0ea5e9" }}>
              <h3 style={statNumberStyle}>24/7</h3>
              <p style={statLabelStyle}>AI Active Protection</p>
            </div>
            <div style={{ ...statCardStyle, borderLeft: "4px solid #f59e0b" }}>
              <h3 style={statNumberStyle}>98.2%</h3>
              <p style={statLabelStyle}>Trio Detection Accuracy</p>
            </div>
            <div style={{ ...statCardStyle, borderLeft: "4px solid #ef4444" }}>
              <h3 style={statNumberStyle}>{activeAlerts}</h3>
              <p style={statLabelStyle}>Active Threat Alerts</p>
            </div>
          </div>

          {/* Two-Column Content Area */}
          <div className="main-grid">
            {/* Left Panel: Trio AI Real-Time Monitoring Stream */}
            <div style={panelStyle}>
              {/* YouTube URL Input + Control Button Group */}
              <div style={panelHeaderStyle}>
                <h2 style={panelTitleStyle}>Trio AI Live Monitoring Stream</h2>
                {/* YouTube URL Input Field */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, maxWidth: "400px" }}>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Paste YouTube video URL here"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      border: "1px solid #334155",
                      borderRadius: "4px",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      color: "#fff",
                      fontSize: "0.75rem",
                      outline: "none"
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && loadVideo()}
                  />
                  <button
                    onClick={loadVideo}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#0ea5e9",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Load Video
                  </button>
                </div>
                {/* Control Button Group */}
                <div style={btnGroupStyle}>
                  <button onClick={resetStatus} style={resetBtnStyle}>Normal Mode</button>
                  <button 
                    onClick={handleDetect} 
                    disabled={!videoId || detectLoading}
                    style={{
                      ...alertBtnStyle,
                      backgroundColor: detectLoading ? "#6b7280" : "#10b981",
                    }}
                  >
                    {detectLoading ? "Detecting..." : "Manual Detect"}
                  </button>
                  <button onClick={triggerMockAlert} style={alertBtnStyle}>Simulate Alert</button>
                </div>
              </div>
              
              {/* Error Tip Display */}
              {errorTip && (
                <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0 0 12px 0" }}>{errorTip}</p>
              )}
              
              {/* Core: Video Playback Window - Position, Size, Styling completely unchanged */}
              <div style={videoContainerStyle}>
                {videoId ? (
                  // YouTube Video Player
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=1`}
                    title="Terratrace YouTube Monitoring Stream"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      aspectRatio: "16/9"
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  // Default background image when no video is loaded
                  <div 
                    style={{
                      ...videoPlaceholderStyle,
                      backgroundImage: aiStatus === "running" 
                        ? "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2070&auto=format&fit=crop)"
                        : "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=2070&auto=format&fit=crop)",
                    }}
                  >
                    {/* Alert Mode Detection Box - Only visible when Simulate Alert is clicked */}
                    {aiStatus === "alert" && (
                      <>
                        <div style={vehicleDetectionBoxStyle}>
                          <div style={{ ...detectionLabelStyle, backgroundColor: "rgba(239, 68, 68, 0.8)" }}>
                            Unauthorized Off-Road Vehicle | Confidence: 92.8% | Trio AI
                          </div>
                        </div>
                        <div style={alertOverlayStyle}>
                          <h2 style={alertTextStyle}>⚠️ UNAUTHORIZED INTRUSION ALERT</h2>
                          <p>Zone 3 Monitoring Grid | Dispatched to Command Center & Nearby Rangers</p>
                        </div>
                      </>
                    )}

                    {/* Stream Timestamp Watermark */}
                    <div style={videoWatermarkStyle}>
                      <span>Serengeti Reserve - Zone 1 Camera</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={videoInfoStyle}>
                <span>Device Status: ✅ Online</span>
                <span>Stream: 720P 25fps</span>
                <span>Auto Scan: Every 60s | Trio AI Vision</span>
              </div>

              {/* Trio API Detection Result Real-Time Display Area */}
              {detectResult && (
                <div style={{
                  padding: "16px",
                  marginTop: "16px",
                  backgroundColor: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 12px 0" }}>Trio AI Latest Detection | {new Date().toLocaleString()}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ padding: "8px 12px", backgroundColor: "rgba(30, 41, 59, 0.5)", borderRadius: "4px" }}>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Detection Status</p>
                      <p style={{ 
                        fontSize: "1rem", fontWeight: 700, margin: 0,
                        color: !detectResult.triggered ? "#10b981" : "#ef4444"
                      }}>
                        {!detectResult.triggered ? "✅ Secure / No Threats" : "❌ High Risk Alert"}
                      </p>
                    </div>
                    <div style={{ padding: "8px 12px", backgroundColor: "rgba(30, 41, 59, 0.5)", borderRadius: "4px" }}>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Response Latency</p>
                      <p style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{detectResult.latency_ms} ms</p>
                    </div>
                    <div style={{ padding: "8px 12px", backgroundColor: "rgba(30, 41, 59, 0.5)", borderRadius: "4px" }}>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Scan Frequency</p>
                      <p style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>1x/Minute</p>
                    </div>
                  </div>
                  <div style={{ padding: "8px 12px", backgroundColor: "rgba(30, 41, 59, 0.5)", borderRadius: "4px" }}>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 4px 0" }}>AI Analysis Explanation</p>
                    <p style={{ fontSize: "0.875rem", margin: 0, color: "#fff" }}>{detectResult.explanation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Trio AI Threat Alert Logs */}
            <div style={panelStyle}>
              <h2 style={panelTitleStyle}>Trio AI Threat Alert History</h2>
              <div style={alertListStyle}>
                {/* Active Alert Pinned to Top */}
                {activeAlerts > 0 && (
                  <div style={{ ...alertItemStyle, border: "1px solid #ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                    <div style={{ ...alertDotStyle, backgroundColor: "#ef4444" }} />
                    <div>
                      <p style={{ ...alertTitleStyle, color: "#ef4444", fontWeight: 700 }}>[ACTIVE] Unauthorized Intrusion Alert</p>
                      <p style={alertTimeStyle}>{new Date().toLocaleString()} | Zone 3 Grid</p>
                    </div>
                    <span style={{ ...alertStatusStyle, color: "#ef4444" }}>In Progress</span>
                  </div>
                )}
                
                <div style={alertItemStyle}>
                  <div style={{ ...alertDotStyle, backgroundColor: "#ef4444" }} />
                  <div>
                    <p style={alertTitleStyle}>Unauthorized Vehicle Intrusion</p>
                    <p style={alertTimeStyle}>2025-06-15 03:24 | Zone 3 Grid</p>
                  </div>
                  <span style={alertStatusStyle}>Resolved</span>
                </div>
                <div style={alertItemStyle}>
                  <div style={{ ...alertDotStyle, backgroundColor: "#f59e0b" }} />
                  <div>
                    <p style={alertTitleStyle}>Suspicious Human Activity</p>
                    <p style={alertTimeStyle}>2025-06-14 22:17 | Zone 2 Grid</p>
                  </div>
                  <span style={alertStatusStyle}>Resolved</span>
                </div>
                <div style={alertItemStyle}>
                  <div style={{ ...alertDotStyle, backgroundColor: "#10b981" }} />
                  <div>
                    <p style={alertTitleStyle}>Target Species Sighting</p>
                    <p style={alertTimeStyle}>2025-06-15 08:42 | Zone 1 Grid</p>
                  </div>
                  <span style={alertStatusStyle}>Normal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Habitat Health Score Panel */}
          <div style={panelStyle}>
            <h2 style={panelTitleStyle}>Habitat Health Composite Score | Trio AI Remote Sensing Analysis</h2>
            <div className="health-grid">
              <div style={healthItemStyle}>
                <h3 style={healthScoreStyle}>92</h3>
                <p style={healthLabelStyle}>Vegetation Cover</p>
              </div>
              <div style={healthItemStyle}>
                <h3 style={healthScoreStyle}>87</h3>
                <p style={healthLabelStyle}>Water Source Health</p>
              </div>
              <div style={healthItemStyle}>
                <h3 style={healthScoreStyle}>95</h3>
                <p style={healthLabelStyle}>Species Activity</p>
              </div>
              <div style={healthItemStyle}>
                <h3 style={healthScoreStyle}>94</h3>
                <p style={healthLabelStyle}>Overall Health Score</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ==================== Style Definitions - 100% completely unchanged ====================
const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100vw",
  backgroundColor: "#0a0e0f",
  color: "#ffffff",
  fontFamily: "system-ui, sans-serif",
  overflowX: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 32px",
  backgroundColor: "rgba(0,0,0,0.5)",
  borderBottom: "1px solid #1e293b",
  position: "sticky",
  top: 0,
  zIndex: 100,
  flexWrap: "wrap",
  gap: "12px",
};

const logoStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 700,
  letterSpacing: "0.05em",
};

const greenTextStyle: React.CSSProperties = {
  color: "#10b981",
};

const sandTextStyle: React.CSSProperties = {
  color: "#d6b378",
};

const navGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "24px",
  alignItems: "center",
  flexWrap: "wrap",
};

const navLinkStyle: React.CSSProperties = {
  color: "#cbd5e1",
  textDecoration: "none",
  transition: "color 0.2s",
};

const previewBadgeStyle: React.CSSProperties = {
  padding: "4px 12px",
  backgroundColor: "#f59e0b",
  color: "#000000",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
};

const trioStatusBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 32px",
  borderBottom: "1px solid",
  flexWrap: "wrap",
  gap: "12px",
  fontSize: "0.875rem",
};

const contentWrapperStyle: React.CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "32px 20px",
};

const pageTitleStyle: React.CSSProperties = {
  marginBottom: "32px",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
  fontWeight: 700,
  margin: "0 0 8px 0",
};

const subtitleStyle: React.CSSProperties = {
  color: "#94a3b8",
  margin: 0,
  fontSize: "1rem",
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: "rgba(30, 41, 59, 0.5)",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #334155",
};

const statNumberStyle: React.CSSProperties = {
  fontSize: "clamp(1.5rem, 3vw, 2rem)",
  fontWeight: 700,
  margin: "0 0 4px 0",
};

const statLabelStyle: React.CSSProperties = {
  color: "#94a3b8",
  margin: 0,
  fontSize: "0.875rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const panelStyle: React.CSSProperties = {
  backgroundColor: "rgba(30, 41, 59, 0.3)",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "20px",
  height: "100%",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
  flexWrap: "wrap",
  gap: "12px",
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  margin: 0,
};

const btnGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
};

const resetBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#10b981",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 700,
  cursor: "pointer",
};

const alertBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 700,
  cursor: "pointer",
};

const videoContainerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  borderRadius: "6px",
  overflow: "hidden",
  marginBottom: "16px",
};

const videoPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "16/9",
  backgroundColor: "#0f172a",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  transition: "all 0.3s ease",
};

const videoWatermarkStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "12px",
  left: "12px",
  right: "12px",
  display: "flex",
  justifyContent: "space-between",
  color: "#fff",
  fontSize: "0.75rem",
  textShadow: "0 2px 4px rgba(0,0,0,0.8)",
  flexWrap: "wrap",
  gap: "8px",
};

const vehicleDetectionBoxStyle: React.CSSProperties = {
  position: "absolute",
  top: "40%",
  right: "25%",
  width: "30%",
  height: "20%",
  border: "2px solid #ef4444",
  borderRadius: "4px",
  animation: "pulse 0.8s infinite",
};

const detectionLabelStyle: React.CSSProperties = {
  position: "absolute",
  top: "-24px",
  left: "-2px",
  padding: "2px 8px",
  backgroundColor: "rgba(16, 185, 129, 0.8)",
  color: "#fff",
  fontSize: "0.75rem",
  fontWeight: 600,
  borderRadius: "4px 4px 0 0",
  whiteSpace: "nowrap",
};

const alertOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "12px 24px",
  backgroundColor: "rgba(239, 68, 68, 0.9)",
  color: "#fff",
  borderRadius: "8px",
  textAlign: "center",
  fontWeight: 700,
  animation: "pulse 0.5s infinite",
  width: "90%",
  maxWidth: "400px",
};

const alertTextStyle: React.CSSProperties = {
  margin: "0 0 4px 0",
  fontSize: "1.25rem",
};

const videoInfoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#94a3b8",
  fontSize: "0.875rem",
  flexWrap: "wrap",
  gap: "8px",
};

const alertListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  height: "100%",
};

const alertItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  backgroundColor: "rgba(15, 23, 42, 0.5)",
  borderRadius: "6px",
  border: "1px solid #1e293b",
  flexWrap: "wrap",
};

const alertDotStyle: React.CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  flexShrink: 0,
};

const alertTitleStyle: React.CSSProperties = {
  margin: "0 0 4px 0",
  fontWeight: 500,
};

const alertTimeStyle: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.75rem",
};

const alertStatusStyle: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: "0.75rem",
  color: "#94a3b8",
  fontWeight: 600,
};

const healthItemStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "16px",
  backgroundColor: "rgba(15, 23, 42, 0.4)",
  borderRadius: "6px",
};

const healthScoreStyle: React.CSSProperties = {
  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
  fontWeight: 700,
  margin: "0 0 4px 0",
  color: "#10b981",
};

const healthLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.875rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};