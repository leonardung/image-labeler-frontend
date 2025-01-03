import React, { useState, useEffect, useRef } from "react";
import { Button, Box, Typography } from "@mui/material";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";  // IMPORTANT: import rc-slider's CSS

const FPS = 24.001676; // Adjust this to match your video frame rate

const VideoDisplaySegmentation = () => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // We’ll track both the current frame and the total duration in seconds.
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);    // in seconds
  const [currentTime, setCurrentTime] = useState(0); // in seconds

  const video_url = "http://media.w3.org/2010/05/bunny/movie.mp4";

  // ─────────────────────────────────────────────────────────
  // This handles jumping to a specific frame (frame-based).
  // ─────────────────────────────────────────────────────────
  const handleFrameChange = (newFrame) => {
    if (!videoRef.current) return;
    const safeFrame = Math.max(newFrame, 0);

    // Pause if currently playing, so the seek is stable
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    // Convert frame to time: time = frame / FPS
    const newTime = safeFrame / FPS;

    // Seek video
    videoRef.current.currentTime = newTime;

    // Update state
    setCurrentFrame(safeFrame);
    setCurrentTime(newTime);
  };

  // ─────────────────────────────────────────────────────────
  // Toggle Play/Pause
  // ─────────────────────────────────────────────────────────
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // ─────────────────────────────────────────────────────────
  // Keep track of:
  //   - total duration (on 'loadedmetadata')
  //   - current time (on 'timeupdate')
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration); // in seconds
    };

    const handleTimeUpdate = () => {
      const newTime = video.currentTime; // in seconds
      setCurrentTime(newTime);
      // Also update frame count if needed
      setCurrentFrame(Math.floor(newTime * FPS));
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // ─────────────────────────────────────────────────────────
  // Handle direct slider changes in seconds
  // ─────────────────────────────────────────────────────────
  const onSliderChange = (newSeconds) => {
    // We'll pause if playing
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setCurrentTime(newSeconds);
  };

  const onSliderAfterChange = (newSeconds) => {
    // Actually seek the video
    if (videoRef.current) {
      videoRef.current.currentTime = newSeconds;
    }
    setCurrentFrame(Math.floor(newSeconds * FPS));
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>

      {/* Control Buttons */}
      <Box
        sx={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          display: "flex",
          gap: 2,
        }}
      >
        <Button variant="contained" onClick={togglePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>

        <Button
          variant="contained"
          onClick={() => handleFrameChange(currentFrame)}
        >
          Previous Frame
        </Button>

        <Button
          variant="contained"
          onClick={() => handleFrameChange(currentFrame + 2)}
        >
          Next Frame
        </Button>
      </Box>

      {/* Video Progress Slider */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          width: "60%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      >
        <Slider
          min={0}
          max={duration}          // total duration in seconds
          value={currentTime}     // current time in seconds
          onChange={onSliderChange}
          onAfterChange={onSliderAfterChange}
          railStyle={{ backgroundColor: '#ccc', height: 6 }}
          trackStyle={{ backgroundColor: '#1976d2', height: 6 }}
          handleStyle={{
            borderColor: '#1976d2',
            height: 20,
            width: 20,
            marginLeft: -10,
            marginTop: -7,
            backgroundColor: '#fff',
          }}
        />
      </Box>

      {/* Current Frame Display (optional) */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 2,
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "4px",
        }}
      >
        <Typography variant="body2">
          Frame: {currentFrame} / {Math.floor(duration * FPS)}
        </Typography>
        <Typography variant="body2">
          Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </Typography>
      </Box>

      {/* Video Container */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          src={video_url}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",    // ensure video fills container
            // height: "auto",   // maintain aspect ratio
          }}
        />
      </div>
    </div>
  );
};

export default VideoDisplaySegmentation;
