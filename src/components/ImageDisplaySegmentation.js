import React, { useState, useEffect, useRef } from "react";
import useImageDisplay from "./useImageDisplay";
import axiosInstance from "../axiosInstance";
import { Checkbox, FormControlLabel, Box, Typography, Button, Slider } from "@mui/material";

const ImageDisplaySegmentation = ({
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
  const [mask, setMask] = useState(previousMask || null);

  const canvasRef = useRef(null);

  useEffect(() => {
    setPoints([]);
    setMask(previousMask || null);
  }, [image]);

  useEffect(() => {
    setMask(previousMask || null);
  }, [previousMask]);


  const handleImageClick = (event) => {
    event.preventDefault();
    if (isPanning) return;
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const clickX = event.clientX - containerRect.left;
    const clickY = event.clientY - containerRect.top;

    // Convert click position to image coordinates
    const imgX = (clickX - panOffset.x) / zoomLevel;
    const imgY = (clickY - panOffset.y) / zoomLevel;

    // Check if click is within the image bounds
    if (
      imgX < 0 ||
      imgX > imgDimensions.width ||
      imgY < 0 ||
      imgY > imgDimensions.height
    ) {
      return;
    }

    // Determine if inclusion or exclusion point
    const isInclude = event.button === 0; // Left-click for include, right-click for exclude

    // Update points
    setPoints((prevPoints) => [
      ...prevPoints,
      { x: imgX, y: imgY, include: isInclude },
    ]);
  };

  // Prevent default context menu on right-click
  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  const generateMask = async () => {
    try {
      const data = {
        coordinates: points,
        mask_input: mask || null,
      };

      const response = await axiosInstance.post(
        `images/${image.id}/generate_mask/`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // Assume the response contains 'mask'
      const maskData = response.data.mask;
      setMask(maskData);

      // Call onMaskChange if provided
      if (onMaskChange) {
        onMaskChange(maskData);
      }
    } catch (error) {
      console.error("Error generating mask:", error);
    }
  };

  // Generate mask whenever points change
  useEffect(() => {
    if (points.length > 0) {
      generateMask();
    }
  }, [points]);


  // Draw the mask onto the canvas whenever it changes
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

    // Scale the canvas to match the image dimensions
    canvas.style.width = `${imgDimensions.width}px`;
    canvas.style.height = `${imgDimensions.height}px`;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create ImageData
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    // Set pixel data based on the mask
    for (let y = 0; y < maskHeight; y++) {
      for (let x = 0; x < maskWidth; x++) {
        const index = (y * maskWidth + x) * 4;
        const value = mask[y][x]; // 0 or 1
        data[index] = 0; // R
        data[index + 1] = 255; // G
        data[index + 2] = 0; // B
        data[index + 3] = value ? 128 : 0; // A (transparency)
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
          {/* Circle to represent the point */}
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

  // Function to clear points and unload model
  const clearPoints = async () => {
    try {
      await axiosInstance.get(`images/unload_model/`);
    } catch (error) {
      console.error('Error unloading model:', error);
    }
    setPoints([]);
    setMask(null);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Toggle for keeping zoom and pan */}
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

      {/* Button to clear points */}
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
            handleMouseDown(e); // Start panning
          } else if (e.button === 0 || e.button === 2) {
            handleImageClick(e); // Process click
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu} // Prevent default context menu
      >
        <img
          ref={imageRef}
          src={image.image}
          alt="Segmentation"
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

        {/* Render the mask overlay */}
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

        {/* Render the points */}
        {renderPoints()}
      </div>
    </div>
  );
};

export default ImageDisplaySegmentation;
