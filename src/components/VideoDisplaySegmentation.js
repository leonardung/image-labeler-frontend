import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import useVideoDisplay from "./useVideoDisplay";
import {
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Button,
  Slider,
} from "@mui/material";

const VideoDisplaySegmentation = ({
  video,
  frameMasks,
  onMaskChange,
}) => {
  const {
    videoRef,
    containerRef,
    zoomLevel,
    panOffset,
    vidDimensions,
    isPanning,
    ShiftKeyPress,
    keepZoomPan,
    handleToggleChange,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    currentFrame,
    setCurrentFrame,
    totalFrames,
    showPreview,
    setShowPreview,
    previewTime,
    previewPosition,
    handleProgressHover,
  } = useVideoDisplay(video.image);

  // ------------------------------
  // State
  // ------------------------------
  const [points, setPoints] = useState([]);
  const [mask, setMask] = useState(frameMasks[currentFrame] || null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Video time-based state
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [duration, setDuration] = useState(0);       // in seconds

  // Hardcode or detect your real FPS
  const frameRate = 30;

  // If your custom hook doesn't manage these, you can track them yourself:
  // const [totalFrames, setTotalFrames] = useState(0);

  const canvasRef = useRef(null);

  // ------------------------------
  // Effects
  // ------------------------------
  // 1) Update mask whenever we change frames
  useEffect(() => {
    setPoints([]);
    setMask(frameMasks[currentFrame] || null);
  }, [currentFrame, frameMasks]);

  // 2) Listen to video events to update currentTime, duration, frames
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleTimeUpdate = () => {
      setCurrentTime(vid.currentTime);
      const computedFrame = Math.floor(vid.currentTime * frameRate);
      setCurrentFrame(computedFrame);
    };

    const handleLoadedMetadata = () => {
      setDuration(vid.duration);
      // If you need to override totalFrames: 
      // setTotalFrames(Math.floor(vid.duration * frameRate));
    };

    vid.addEventListener("timeupdate", handleTimeUpdate);
    vid.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      vid.removeEventListener("timeupdate", handleTimeUpdate);
      vid.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoRef, setCurrentFrame, frameRate]);

  // 3) Whenever `points` changes, attempt to generate a new mask
  useEffect(() => {
    if (points.length > 0) {
      generateMask();
    }
  }, [points]); // eslint-disable-line

  // 4) Handle drawing mask on canvas
  useEffect(() => {
    if (
      !mask ||
      !canvasRef.current ||
      mask.length === 0 ||
      !Array.isArray(mask[0]) ||
      mask[0].length === 0
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const maskWidth = mask[0].length;
    const maskHeight = mask.length;

    canvas.width = maskWidth;
    canvas.height = maskHeight;

    canvas.style.width = `${vidDimensions.width}px`;
    canvas.style.height = `${vidDimensions.height}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < maskHeight; y++) {
      for (let x = 0; x < maskWidth; x++) {
        const index = (y * maskWidth + x) * 4;
        const value = mask[y][x];

        // RGBA
        data[index] = 0;      // R
        data[index + 1] = 255; // G
        data[index + 2] = 0;  // B
        data[index + 3] = value ? 128 : 0; // A (semi-transparent if mask=1)
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [mask, vidDimensions]);

  // ------------------------------
  // Segmentation / Mask methods
  // ------------------------------
  const handleImageClick = (event) => {
    event.preventDefault();
    if (isPanning) return;
    if (!containerRef.current || !videoRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const clickX = event.clientX - containerRect.left;
    const clickY = event.clientY - containerRect.top;

    // Convert click position to video coordinates
    const vidX = (clickX - panOffset.x) / zoomLevel;
    const vidY = (clickY - panOffset.y) / zoomLevel;

    // Check if click is within the video bounds
    if (
      vidX < 0 ||
      vidX > vidDimensions.width ||
      vidY < 0 ||
      vidY > vidDimensions.height
    ) {
      return;
    }

    // Left-click => inclusion point, Right-click => exclusion point
    const isInclude = event.button === 0;

    // Update points
    setPoints((prevPoints) => [
      ...prevPoints,
      { x: vidX, y: vidY, include: isInclude },
    ]);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  const generateMask = async () => {
    try {
      const data = {
        coordinates: points,
        mask_input: mask || null,
        frame: currentFrame,
      };

      const response = await axiosInstance.post(
        `videos/${video.id}/generate_mask/`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const maskData = response.data.mask;
      setMask(maskData);

      if (onMaskChange) {
        onMaskChange(currentFrame, maskData);
      }
    } catch (error) {
      console.error("Error generating mask:", error);
    }
  };

  const clearPoints = () => {
    setPoints([]);
    setMask(null);
  };

  // ------------------------------
  // Playback controls
  // ------------------------------
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePreviousFrame = () => {
    if (videoRef.current) {
      const newTime = Math.max(0, (currentFrame - 1) / frameRate);
      videoRef.current.currentTime = newTime;
      setCurrentFrame(Math.floor(newTime * frameRate));
    }
  };

  const handleNextFrame = () => {
    if (videoRef.current) {
      const newTime = Math.min(duration, (currentFrame + 1) / frameRate);
      videoRef.current.currentTime = newTime;
      setCurrentFrame(Math.floor(newTime * frameRate));
    }
  };

  // ------------------------------
  // Slider (time-based)
  // ------------------------------
  const handleSliderChange = (event, newValue) => {
    setCurrentTime(newValue); 
  };

  // Called when user finishes sliding or clicks on the slider
  const handleSliderChangeCommitted = (event, newValue) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newValue;
      setCurrentFrame(Math.floor(newValue * frameRate));
    }
  };

  // ------------------------------
  // Rendering Points
  // ------------------------------
  const renderPoints = () => {
    return points.map((point, index) => {
      const x = point.x * zoomLevel + panOffset.x;
      const y = point.y * zoomLevel + panOffset.y;

      return (
        <div
          key={`${point.x}-${point.y}-${index}`}
          style={{
            position: "absolute",
            pointerEvents: "none",
            top: `${y}px`,
            left: `${x}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              backgroundColor: point.include ? "green" : "red",
              border: "2px solid white",
            }}
          />
        </div>
      );
    });
  };

  // ------------------------------
  // Helpers
  // ------------------------------
  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Keep Zoom & Pan checkbox */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1,
          backgroundColor: "rgba(250,250,250, 0.4)",
          paddingLeft: 1,
          borderRadius: 1,
          color: "black",
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={keepZoomPan}
              onChange={handleToggleChange}
              color="primary"
            />
          }
          label={
            <Typography sx={{ fontWeight: "bold" }}>
              Keep Zoom and Pan
            </Typography>
          }
        />
      </Box>

      {/* Clear Points button */}
      <Box
        sx={{
          position: "absolute",
          top: 60,
          left: 10,
          zIndex: 1,
          borderRadius: 1,
          color: "black",
        }}
      >
        <Button variant="contained" color="secondary" onClick={clearPoints}>
          Clear Points
        </Button>
      </Box>

      {/* Playback Control Buttons */}
      <Box
        sx={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
          display: "flex",
          gap: 2,
        }}
      >
        <Button variant="contained" onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button variant="contained" onClick={handlePreviousFrame}>
          Previous Frame
        </Button>
        <Button variant="contained" onClick={handleNextFrame}>
          Next Frame
        </Button>
      </Box>

      {/* Slider-based timeline */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
          width: "80%",
        }}
      >
        <Slider
          min={0}
          max={duration}
          step={0.01}
          value={Math.min(currentTime, duration)}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          aria-labelledby="video-progress-slider"
        />

        {/* Time Display */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
          }}
        >
          <Typography variant="body2">{formatTime(currentTime)}</Typography>
          <Typography variant="body2">{formatTime(duration)}</Typography>
        </Box>
      </Box>

      {/* Container holding video + mask + points */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          cursor: ShiftKeyPress
            ? isPanning
              ? "grabbing"
              : "grab"
            : "crosshair",
        }}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          if (e.shiftKey) {
            handleMouseDown(e);
          } else if (e.button === 0 || e.button === 2) {
            handleImageClick(e);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {/* Actual video */}
        <video
          ref={videoRef}
          src={video.image}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${vidDimensions.width}px`,
            height: `${vidDimensions.height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {/* Mask overlay */}
        {mask && (
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${vidDimensions.width}px`,
              height: `${vidDimensions.height}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: "0 0",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Points for segmentation */}
        {renderPoints()}
      </div>

      {/* Frame/Time Preview (if implemented) */}
      {showPreview && (
        <div
          style={{
            position: "absolute",
            top: `${previewPosition.y}px`,
            left: `${previewPosition.x}px`,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <img
            src={`${video.image}?time=${previewTime}`}
            alt="Preview"
            style={{
              width: "100px",
              height: "auto",
              border: "2px solid white",
              borderRadius: "4px",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoDisplaySegmentation;
