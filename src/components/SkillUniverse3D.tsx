"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Globe2,
  Layers,
  RotateCw,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
  Info,
  ShieldCheck,
  CircleDot,
  Lock,
  Brain,
} from "lucide-react";
import { SKILLS_TAXONOMY, type Skill } from "@/lib/curriculum";

type SkillNode = Skill & {
  // 3D coordinates on unit sphere (Fibonacci distribution)
  x: number;
  y: number;
  z: number;
  // UI state
  masteryState: SkillMasteryState;
  evidenceScore: number;
  connectedSkillIds: string[];
};

type SkillMasteryState =
  | "not_started"
  | "learning"
  | "developing"
  | "practising"
  | "demonstrated"
  | "needs_revision";

type Props = {
  completedLessonIds?: string[];
  lessons?: { id: string; skillIds: string[] }[];
  skillMastery?: { skillId: string; state: string; evidenceScore: number }[];
};

// Distribute points on a sphere using the Fibonacci spiral
function fibonacciSphere(n: number): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = [];
  const phi = Math.PI * (Math.sqrt(5) - 1); // golden angle
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2; // y from 1 to -1
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    points.push({ x, y, z });
  }
  return points;
}

const MASTERY_COLORS: Record<SkillMasteryState, string> = {
  not_started: "#a7bdb4",
  learning: "#74c0fc",
  developing: "#ffd43b",
  practising: "#ff922b",
  demonstrated: "#69db7c",
  needs_revision: "#ff6b6b",
};

const MASTERY_LABELS: Record<SkillMasteryState, string> = {
  not_started: "Not Started",
  learning: "Learning",
  developing: "Developing",
  practising: "Practising",
  demonstrated: "Demonstrated",
  needs_revision: "Needs Revision",
};

const CATEGORY_RADII: Record<string, number> = {
  Foundations: 1.0,
  "Technical Analysis": 1.05,
  "Risk Management": 1.1,
  Psychology: 1.15,
  "Binary Options": 1.2,
};

export default function SkillUniverse3D({
  completedLessonIds = [],
  lessons = [],
  skillMastery = [],
}: Props) {
  const [rotation, setRotation] = useState({ x: -15, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [scale, setScale] = useState(1);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    rotX: 0,
    rotY: 0,
  });

  // Auto-rotate
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setRotation(r => ({ ...r, y: r.y + 0.4 }));
    }, 50);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Build skill nodes with 3D positions
  const nodes: SkillNode[] = useMemo(() => {
    const points = fibonacciSphere(Math.max(SKILLS_TAXONOMY.length, 9));
    return SKILLS_TAXONOMY.map((skill, idx) => {
      const point = points[idx % points.length];
      const radius = CATEGORY_RADII[skill.category] ?? 1.0;

      // Compute mastery state from lessons + skillMastery records
      const masteryRecord = skillMastery.find(m => m.skillId === skill.id);
      const associatedLesson = lessons.find(l => l.skillIds.includes(skill.id));
      const isCompleted = associatedLesson
        ? completedLessonIds.includes(associatedLesson.id)
        : false;

      let masteryState: SkillMasteryState;
      let evidenceScore = 0;
      if (masteryRecord) {
        masteryState = masteryRecord.state as SkillMasteryState;
        evidenceScore = masteryRecord.evidenceScore;
      } else if (isCompleted) {
        masteryState = "demonstrated";
        evidenceScore = 80;
      } else {
        masteryState = "not_started";
        evidenceScore = 0;
      }

      return {
        ...skill,
        x: point.x * radius,
        y: point.y * radius,
        z: point.z * radius,
        masteryState,
        evidenceScore,
        connectedSkillIds: skill.prerequisites || [],
      };
    });
  }, [completedLessonIds, lessons, skillMastery]);

  // Build edges (prerequisite links)
  const edges = useMemo(() => {
    const list: { from: SkillNode; to: SkillNode }[] = [];
    nodes.forEach(node => {
      node.connectedSkillIds.forEach(prereqId => {
        const target = nodes.find(n => n.id === prereqId);
        if (target) list.push({ from: target, to: node });
      });
    });
    return list;
  }, [nodes]);

  const selectedNode = selectedSkillId
    ? nodes.find(n => n.id === selectedSkillId)
    : null;

  // Stats
  const stats = useMemo(() => {
    const total = nodes.length;
    const demonstrated = nodes.filter(n => n.masteryState === "demonstrated").length;
    const learning = nodes.filter(n => ["learning", "developing", "practising"].includes(n.masteryState)).length;
    const notStarted = nodes.filter(n => n.masteryState === "not_started").length;
    const needsRevision = nodes.filter(n => n.masteryState === "needs_revision").length;
    const avgEvidence = total > 0 ? nodes.reduce((s, n) => s + n.evidenceScore, 0) / total : 0;
    return { total, demonstrated, learning, notStarted, needsRevision, avgEvidence };
  }, [nodes]);

  // Drag handlers
  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setAutoRotate(false);
    dragStart.current = { x: e.clientX, y: e.clientY, rotX: rotation.x, rotY: rotation.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotation({
      x: Math.max(-89, Math.min(89, dragStart.current.rotX - dy * 0.4)),
      y: dragStart.current.rotY + dx * 0.4,
    });
  }
  function onMouseUp() {
    setDragging(false);
  }

  // Project a 3D point onto 2D screen with perspective
  function project(x: number, y: number, z: number) {
    const perspective = 600;
    // Rotate around Y axis
    const cosY = Math.cos((rotation.y * Math.PI) / 180);
    const sinY = Math.sin((rotation.y * Math.PI) / 180);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    // Rotate around X axis
    const cosX = Math.cos((rotation.x * Math.PI) / 180);
    const sinX = Math.sin((rotation.x * Math.PI) / 180);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    // Perspective projection
    const sphereRadius = 200 * scale;
    const screenX = (x1 * sphereRadius * perspective) / (perspective + z2 * sphereRadius);
    const screenY = (y1 * sphereRadius * perspective) / (perspective + z2 * sphereRadius);
    const depth = (z2 + 1.4) / 2.4; // 0 (back) → 1 (front)
    return { screenX, screenY, depth, z2 };
  }

  return (
    <div className="risk-lab-container">
      <div className="risk-lab-header">
        <div className="header-left">
          <div className="kicker-badge">
            <Globe2 size={15} /> 3D SKILL UNIVERSE
          </div>
          <h2>The Constellation of Your Trading Mastery</h2>
          <p>
            Every skill is a star. Every prerequisite is a constellation line. Mastery states
            paint the sky: <strong style={{ color: "#69db7c" }}>green = demonstrated</strong>,
            <strong style={{ color: "#ffd43b" }}> amber = developing</strong>,
            <strong style={{ color: "#7c8b86" }}> grey = uncharted</strong>. Drag to rotate. Scroll to zoom. Click any star to inspect.
          </p>
        </div>
        <div className="universe-controls">
          <button
            className="universe-ctrl-btn"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Pause rotation" : "Resume rotation"}
          >
            {autoRotate ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            className="universe-ctrl-btn"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="universe-ctrl-btn"
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="universe-ctrl-btn"
            onClick={() => { setRotation({ x: -15, y: 0 }); setScale(1); }}
            title="Reset view"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      <div className="universe-layout">
        {/* 3D Canvas */}
        <div
          className="universe-canvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: dragging ? "grabbing" : "grab" }}
        >
          {/* NOTE: centring is done by .universe-stage in globals.css
              (top/left 50% + negative margins). Adding a translate(-50%,-50%)
              here as well shifted the whole sphere 300px up and left, which
              pushed most skill nodes outside .universe-canvas where
              overflow:hidden clipped them. */}
          <div className="universe-stage">
            <svg
              width="100%"
              height="100%"
              viewBox="-300 -300 600 600"
              preserveAspectRatio="xMidYMid meet"
              style={{ overflow: "visible" }}
            >
              {/* Ambient background rings (orbital guides) */}
              {[0.7, 0.9, 1.1, 1.3].map((r, idx) => (
                <ellipse
                  key={idx}
                  cx="0"
                  cy="0"
                  rx={200 * r * scale}
                  ry={200 * r * scale * Math.abs(Math.sin((rotation.x * Math.PI) / 180))}
                  fill="none"
                  stroke="#dde6db"
                  strokeWidth="0.5"
                  strokeDasharray="2,4"
                  opacity="0.4"
                />
              ))}

              {/* Edges (prerequisite connections) */}
              {edges.map((edge, idx) => {
                const from = project(edge.from.x, edge.from.y, edge.from.z);
                const to = project(edge.to.x, edge.to.y, edge.to.z);
                const avgDepth = (from.depth + to.depth) / 2;
                const isConnected = selectedNode &&
                  (selectedNode.id === edge.from.id || selectedNode.id === edge.to.id);
                return (
                  <line
                    key={idx}
                    x1={from.screenX}
                    y1={from.screenY}
                    x2={to.screenX}
                    y2={to.screenY}
                    stroke={isConnected ? "#c9ed85" : "#9bc2b0"}
                    strokeWidth={isConnected ? 1.5 : 0.6}
                    strokeOpacity={isConnected ? 0.9 : avgDepth * 0.4}
                  />
                );
              })}

              {/* Nodes (skill stars) */}
              {[...nodes]
                .sort((a, b) => {
                  // Render back-to-front for proper depth layering
                  const pa = project(a.x, a.y, a.z);
                  const pb = project(b.x, b.y, b.z);
                  return pa.z2 - pb.z2;
                })
                .map(node => {
                  const p = project(node.x, node.y, node.z);
                  const isSelected = selectedSkillId === node.id;
                  const baseRadius = 9 + (node.evidenceScore / 100) * 11;
                  const radius = baseRadius * (0.72 + p.depth * 0.5);
                  // Floor raised from 0.3: with depth in [0.08, 1.08] the old
                  // curve left most of the sphere below 35% and the canvas looked empty.
                  const glowOpacity = 0.62 + p.depth * 0.38;
                  const color = MASTERY_COLORS[node.masteryState];
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${p.screenX}, ${p.screenY})`}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedSkillId(isSelected ? null : node.id);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Glow halo */}
                      <circle
                        r={radius * 2.5}
                        fill={color}
                        opacity={isSelected ? 0.45 : glowOpacity * 0.32}
                      />
                      {/* Main node */}
                      <circle
                        r={radius}
                        fill={color}
                        opacity={glowOpacity}
                        stroke={isSelected ? "#fff" : "rgba(255,255,255,0.4)"}
                        strokeWidth={isSelected ? 2 : 0.8}
                      />
                      {/* Inner dot for demonstrated skills */}
                      {node.masteryState === "demonstrated" && (
                        <circle r={radius * 0.4} fill="#fff" opacity={glowOpacity} />
                      )}
                      {/* Label (only for front-most nodes or selected) */}
                      {(p.depth > 0.42 || isSelected) && (
                        <text
                          y={radius + 14}
                          textAnchor="middle"
                          fontSize="11"
                          fontFamily="Manrope, sans-serif"
                          fontWeight={700}
                          /* Light ink: this canvas is a #1a3a32 -> #0e1f1c gradient,
                             so the previous #4a6357 labels were dark-on-dark and
                             never legible. */
                          fill={isSelected ? "#c9ed85" : "#cfe3d7"}
                          opacity={isSelected ? 1 : Math.min(1, 0.55 + p.depth * 0.45)}
                          style={{ pointerEvents: "none" }}
                        >
                          {node.code}
                        </text>
                      )}
                    </g>
                  );
                })}
            </svg>

            {/* Center indicator */}
            <div className="universe-center-marker">
              <Brain size={16} />
            </div>

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="universe-empty">
                <Info size={20} />
                <p>No skills loaded. Complete lessons to populate your skill universe.</p>
              </div>
            )}
          </div>

          {/* Legend overlay */}
          <div className="universe-legend">
            <div className="legend-title">MASTERY STATE</div>
            {Object.entries(MASTERY_COLORS).map(([state, color]) => (
              <div key={state} className="legend-row">
                <span className="legend-dot" style={{ background: color }} />
                <span>{MASTERY_LABELS[state as SkillMasteryState]}</span>
                <strong>{nodes.filter(n => n.masteryState === state).length}</strong>
              </div>
            ))}
          </div>

          {/* Stats overlay */}
          <div className="universe-stats">
            <div className="universe-stat-tile">
              <span>Total Skills</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="universe-stat-tile">
              <span>Demonstrated</span>
              <strong style={{ color: "#69db7c" }}>{stats.demonstrated}</strong>
            </div>
            <div className="universe-stat-tile">
              <span>In Progress</span>
              <strong style={{ color: "#ffd43b" }}>{stats.learning}</strong>
            </div>
            <div className="universe-stat-tile">
              <span>Avg Evidence</span>
              <strong>{stats.avgEvidence.toFixed(0)}%</strong>
            </div>
          </div>
        </div>

        {/* Selected Skill Detail Panel */}
        <div className="universe-detail-panel">
          {!selectedNode ? (
            <div className="universe-detail-empty">
              <CircleDot size={32} />
              <h3>Inspect a Skill</h3>
              <p>Click any star in the universe to see its mastery state, evidence score, prerequisite chain, and recommended lessons.</p>
              <div className="detail-hint">
                <Layers size={14} />
                <span>Drag the canvas to rotate the sphere in 3D space.</span>
              </div>
            </div>
          ) : (
            <div className="universe-detail-content">
              <div className="detail-header">
                <span
                  className="detail-color-bar"
                  style={{ background: MASTERY_COLORS[selectedNode.masteryState] }}
                />
                <div>
                  <span className="detail-code">{selectedNode.code}</span>
                  <h3>{selectedNode.name}</h3>
                </div>
              </div>

              <div
                className="detail-state-pill"
                style={{
                  background: `${MASTERY_COLORS[selectedNode.masteryState]}22`,
                  color: MASTERY_COLORS[selectedNode.masteryState],
                  borderColor: MASTERY_COLORS[selectedNode.masteryState],
                }}
              >
                {MASTERY_LABELS[selectedNode.masteryState].toUpperCase()}
              </div>

              <p className="detail-description">{selectedNode.description}</p>

              <div className="detail-metric-row">
                <span>Evidence Score</span>
                <div className="detail-progress-track">
                  <div
                    className="detail-progress-fill"
                    style={{
                      width: `${selectedNode.evidenceScore}%`,
                      background: MASTERY_COLORS[selectedNode.masteryState],
                    }}
                  />
                </div>
                <strong>{selectedNode.evidenceScore}%</strong>
              </div>

              <div className="detail-category">
                <span>CATEGORY</span>
                <strong>{selectedNode.category}</strong>
              </div>

              {selectedNode.connectedSkillIds.length > 0 && (
                <div className="detail-prereqs">
                  <span>PREREQUISITE SKILLS</span>
                  {selectedNode.connectedSkillIds.map(pid => {
                    const prereqNode = nodes.find(n => n.id === pid);
                    return (
                      <button
                        key={pid}
                        className="detail-prereq-btn"
                        onClick={() => setSelectedSkillId(pid)}
                      >
                        {prereqNode ? (
                          <>
                            <Lock size={11} style={{ color: MASTERY_COLORS[prereqNode.masteryState] }} />
                            <span>{prereqNode.code}</span>
                            <small>{prereqNode.name}</small>
                          </>
                        ) : (
                          <span>{pid}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Skills that depend on this one */}
              {(() => {
                const dependents = nodes.filter(n => n.connectedSkillIds.includes(selectedNode.id));
                if (dependents.length === 0) return null;
                return (
                  <div className="detail-prereqs">
                    <span>UNLOCKS ({dependents.length} SKILLS)</span>
                    {dependents.map(dep => (
                      <button
                        key={dep.id}
                        className="detail-prereq-btn unlocks"
                        onClick={() => setSelectedSkillId(dep.id)}
                      >
                        <ShieldCheck size={11} style={{ color: MASTERY_COLORS[dep.masteryState] }} />
                        <span>{dep.code}</span>
                        <small>{dep.name}</small>
                      </button>
                    ))}
                  </div>
                );
              })()}

              <div className="detail-insight">
                {selectedNode.masteryState === "demonstrated" ? (
                  <>
                    <ShieldCheck size={14} />
                    <span>You have demonstrated this skill. Spaced repetition will keep it sharp.</span>
                  </>
                ) : selectedNode.masteryState === "not_started" ? (
                  <>
                    <CircleDot size={14} />
                    <span>This skill is uncharted. Complete the prerequisite lessons to unlock it.</span>
                  </>
                ) : (
                  <>
                    <Info size={14} />
                    <span>Skill is in progress. Keep practising — evidence accumulates with each correct assessment.</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
