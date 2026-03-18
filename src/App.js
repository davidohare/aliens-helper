import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const PHASES = [
  ["MARINE PHASE", ["ACTIVATE", "MOVE / ATTACK", "EQUIPMENT", "END"]],
  ["ALIEN PHASE", ["REVEAL", "MOVE", "ATTACK"]],
  ["TRACKER", ["DRAW CARD", "SPAWN BLIPS"]]
];

function useMotionTrackerSound(intensity) {
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);

  const start = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (timerRef.current) return;

    const ctx = audioCtxRef.current;

    const playPing = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = 800 + intensity * 400;
      gain.gain.value = 0.05;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    };

    const loop = () => {
      playPing();
      const delay = Math.max(150, 800 - intensity * 120);
      timerRef.current = setTimeout(loop, delay);
    };

    loop();
  };

  return { start };
}

function Radar({ phase, step, round }) {
  const [blips, setBlips] = useState([]);
  const [started, setStarted] = useState(false);

  const intensity =
    blips.length +
    blips.reduce((acc, b) => {
      const dx = b.x - 50;
      const dy = b.y - 50;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return acc + (100 - dist) / 100;
    }, 0);

  const sound = useMotionTrackerSound(intensity);

  useEffect(() => {
    const newBlip = {
      id: Date.now(),
      x: Math.random() * 100,
      y: Math.random() * 100
    };
    setBlips((prev) => [...prev, newBlip].slice(-8));
  }, [step, phase]);

  const handleStart = () => {
    if (!started) {
      sound.start();
      setStarted(true);
    }
  };

  return (
    <div className="radar" onClick={handleStart}>
      <div
        className="danger-glow"
        style={{ opacity: Math.min(intensity / 10, 0.6) }}
      />

      <div className="sweep" />
      <div className="grid" />

      {blips.map((b) => (
        <div
          key={b.id}
          className="blip"
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
        />
      ))}

      <div className="hud">
        <div>ROUND {round}</div>
        <div>{phase}</div>
        <div className="step">{step}</div>
        <div className="intensity">
          SIGNAL: {Math.floor(intensity)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [round, setRound] = useState(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const phase = PHASES[phaseIndex];

  const next = () => {
    if (stepIndex < phase[1].length - 1) {
      setStepIndex(stepIndex + 1);
    } else if (phaseIndex < PHASES.length - 1) {
      setPhaseIndex(phaseIndex + 1);
      setStepIndex(0);
    } else {
      setRound(round + 1);
      setPhaseIndex(0);
      setStepIndex(0);
    }
  };

  return (
    <div className="App" onClick={next}>
      <Radar
        round={round}
        phase={phase[0]}
        step={phase[1][stepIndex]}
      />
    </div>
  );
}
