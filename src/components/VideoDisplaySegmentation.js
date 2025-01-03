import React, { useState, useEffect, useRef } from "react";
import useImageDisplay from "./useImageDisplay";
import useVideoDisplay from "./useVideoDisplay";
import axiosInstance from "../axiosInstance";
import { Checkbox, FormControlLabel, Box, Typography, Button, Slider } from "@mui/material";

const VideoDisplaySegmentation = ({
  image,
  previousMask,
  onMaskChange,
}) => {
  const {
    imageRef,
    containerRef,
    zoomLevel,
    panOffset,
    imgDimensions,
    isPanning,
    ShiftKeyPress,
    keepZoomPan,
    handleToggleChange,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    calculateDisplayParams,
  } = useImageDisplay(image.image);


  const [points, setPoints] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [mask, setMask] = useState(previousMask[currentFrame] || null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setPoints([]);
    setMask(previousMask[currentFrame] || null);
  }, [currentFrame]);

  const handleImageClick = (event) => {

    event.preventDefault();
    if (isPanning) return;
    if (!containerRef.current || !imageRef.current) return;

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
      vidX > imgDimensions.width ||
      vidY < 0 ||
      vidY > imgDimensions.height
    ) {
      return;
    }

    // Determine if inclusion or exclusion point
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
        `videos/${image.id}/generate_mask/`,
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

  useEffect(() => {
    if (points.length > 0) {
      generateMask();
    }
  }, [points]);

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

    canvas.style.width = `${imgDimensions.width}px`;
    canvas.style.height = `${imgDimensions.height}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < maskHeight; y++) {
      for (let x = 0; x < maskWidth; x++) {
        const index = (y * maskWidth + x) * 4;
        const value = mask[y][x];
        data[index] = 0;
        data[index + 1] = 255;
        data[index + 2] = 0;
        data[index + 3] = value ? 128 : 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [mask, imgDimensions]);

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
          ></div>
        </div>
      );
    });
  };

  const clearPoints = () => {
    setPoints([]);
    setMask(null);
  };

  const [isPlaying, setIsPlaying] = useState(false);

  const handleFrameChange = (newFrame) => {
    if (!imageRef.current) return;
    const safeFrame = Math.max(newFrame, 0);
    if (isPlaying) {
      imageRef.current.pause();
      setIsPlaying(false);
    }
    const newTime = safeFrame / image.frame_rate;
    console.log(newFrame, safeFrame, image.frame_rate)
    console.log(imageRef.current.currentTime, newTime)
    imageRef.current.currentTime = newTime;
    setCurrentFrame(safeFrame);
  };

  useEffect(() => {
    const video = imageRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // If you want to keep your 'currentFrame' synced to the actual currentTime
      const frame = Math.floor(video.currentTime * image.frame_rate);
    console.log("time update", video.currentTime, image.frame_rate, video.currentTime)
    setCurrentFrame(frame);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  const togglePlayPause = () => {
    if (imageRef.current) {
      if (isPlaying) {
        imageRef.current.pause();
      } else {
        imageRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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

      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
          display: "flex",
          gap: 2,
        }}
      >
        <Button variant="contained" onClick={togglePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button variant="contained" onClick={() => handleFrameChange(currentFrame)}>
          Previous Frame
        </Button>
        <Button variant="contained" onClick={() => handleFrameChange(currentFrame + 2)}>
          Next Frame
        </Button>
      </Box>


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
        <video
          ref={imageRef}
          src={image.image}
          onLoad={calculateDisplayParams}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${imgDimensions.width}px`,
            height: `${imgDimensions.height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {mask && (
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${imgDimensions.width}px`,
              height: `${imgDimensions.height}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: "0 0",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        )}

        {renderPoints()}
      </div>
    </div>
  );
};

export default VideoDisplaySegmentation;
