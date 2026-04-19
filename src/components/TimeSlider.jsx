import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TimeSlider.css';

const MAX_SECONDS = 300;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimeSlider({ onTimeChange }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const intervalRef = useRef(null);
  const currentTimeRef = useRef(0);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (currentTimeRef.current >= MAX_SECONDS) {
      // Reset to start before playing
      currentTimeRef.current = 0;
      setCurrentTime(0);
      if (onTimeChange) onTimeChange(0);
    }
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      const next = currentTimeRef.current + 1;
      if (next >= MAX_SECONDS) {
        currentTimeRef.current = MAX_SECONDS;
        setCurrentTime(MAX_SECONDS);
        if (onTimeChange) onTimeChange(MAX_SECONDS);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPlaying(false);
      } else {
        currentTimeRef.current = next;
        setCurrentTime(next);
        if (onTimeChange) onTimeChange(next);
      }
    }, 1000);
  }, [onTimeChange]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  const handleReset = useCallback(() => {
    stopPlayback();
    currentTimeRef.current = 0;
    setCurrentTime(0);
    if (onTimeChange) onTimeChange(0);
  }, [stopPlayback, onTimeChange]);

  const handleSliderChange = useCallback((e) => {
    const val = Number(e.target.value);
    stopPlayback();
    currentTimeRef.current = val;
    setCurrentTime(val);
    if (onTimeChange) onTimeChange(val);
  }, [stopPlayback, onTimeChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress = (currentTime / MAX_SECONDS) * 100;

  return (
    <div className="timeslider">
      <button
        className="timeslider-btn timeslider-reset"
        onClick={handleReset}
        title="Tilbakestill til 0"
      >
        ⏮
      </button>

      <button
        className="timeslider-btn timeslider-playpause"
        onClick={handlePlayPause}
        title={isPlaying ? 'Pause' : 'Spill av'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="timeslider-display">
        {formatTime(currentTime)}
      </div>

      <div className="timeslider-track-wrap">
        <input
          type="range"
          className="timeslider-range"
          min={0}
          max={MAX_SECONDS}
          step={1}
          value={currentTime}
          onChange={handleSliderChange}
          style={{ '--progress': `${progress}%` }}
        />
      </div>

      <div className="timeslider-max">
        {formatTime(MAX_SECONDS)}
      </div>
    </div>
  );
}
