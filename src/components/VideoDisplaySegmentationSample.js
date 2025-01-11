import React, { useState, useEffect, useRef } from "react";
import { Button, Box, Typography, Slider } from "@mui/material";

const FPS = 24.001676; // Adjust to match your video frame rate
// const FPS = 50.004028; // Adjust to match your video frame rate

const VideoDisplaySegmentation = () => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const video_url = "http://media.w3.org/2010/05/bunny/movie.mp4";
  // const video_url = "http://localhost:8000/media/images/RS_Buffert_Br%C3%A4d_2024-11-13_11_32_37_498_u5sDlvw.mp4";

  const handleFrameChange = (newFrame) => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    console.log("currentFrame", currentFrame)
    console.log("currentTime", currentTime)
    const safeFrame = Math.max(newFrame, 0);
    const newTime = safeFrame / FPS;
    videoRef.current.currentTime = newTime;
    console.log("safeFrame", safeFrame)
    console.log("FPS", FPS)
    console.log("newTime", newTime)
    setCurrentFrame(safeFrame);
    setCurrentTime(newTime);
    console.log("currentFrame", currentFrame)
    console.log("currentTime", currentTime)
    console.log("111111111111111")
  };
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
  // Get video duration (once) and track currentTime.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration); // total duration in seconds
    };

    const handleTimeUpdate = () => {
      const newTime = video.currentTime; // in seconds
      setCurrentTime(newTime);
      // Calculate frame from current time
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
  // Slider: onChange => update local time while dragging and seek video once user stops
  // ─────────────────────────────────────────────────────────
  const handleSliderChange = (event, newValue) => {
    // We'll pause if playing while dragging
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    setCurrentTime(newValue);
    if (videoRef.current) {
      videoRef.current.currentTime = newValue;
    }
    // Update frame count
    setCurrentFrame(Math.floor(newValue * FPS));
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
          {isPlaying ? "Pause" : "Play"}
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
          width: "80%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      >
        <Slider
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={handleSliderChange}
          aria-labelledby="video-progress-slider"
        />
      </Box>

      {/* Current Frame & Time Display (Optional) */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 2,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "#fff",
          padding: "8px 12px",
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
            width: "100%",
            height: "auto", // maintain aspect ratio
          }}
        />
      </div>
    </div>
  );
};

export default VideoDisplaySegmentation;
