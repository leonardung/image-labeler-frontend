// ImageDisplayCoordinate.js
import React from "react";
import useImageDisplay from "./useImageDisplay";
import { Checkbox, FormControlLabel, Box, Typography } from "@mui/material";

const ImageDisplayCoordinate = ({
  image,
  coordinates,
  modelType,
  onCoordinatesChange,
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

  const handleImageClick = (event) => {
    if (isPanning || ShiftKeyPress) return;

    if (!containerRef.current || !imageRef.current) {
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const clickX = event.clientX - containerRect.left;
    const clickY = event.clientY - containerRect.top;

    const imgX = (clickX - panOffset.x) / zoomLevel;
    const imgY = (clickY - panOffset.y) / zoomLevel;

    if (
      imgX < 0 ||
      imgX > imgDimensions.width ||
      imgY < 0 ||
      imgY > imgDimensions.height
    ) {
      return;
    }

    // Pass only the new coordinate
    onCoordinatesChange({ x: imgX, y: imgY });
  };

  const getCrosshairPositions = () => {
    if (!coordinates[image.id]) {
      return [];
    }

    return coordinates[image.id].map((coord) => {
      const x = coord.x * zoomLevel + panOffset.x;
      const y = coord.y * zoomLevel + panOffset.y;
      return { top: y, left: x };
    });
  };

  const crosshairPositions =
    modelType === "multi_point_coordinate"
      ? getCrosshairPositions()
      : getCrosshairPositions().slice(0, 1);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Toggle for keeping zoom and pan */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1,
          backgroundColor: "rgba(250,250,250, 0.4)", // half-transparent gray
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleImageClick}
      >
        <img
          ref={imageRef}
          src={image.image}
          alt="Label"
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
            pointerEvents: "none", // Ensure mouse events pass through the image
          }}
        />

        {/* Display crosshairs at the labeled coordinates if available */}
        {coordinates[image.id] &&
          crosshairPositions.map((position, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                pointerEvents: "none",
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Horizontal part of the crosshair */}
              <div
                style={{
                  position: "absolute",
                  width: "20px",
                  height: "2px",
                  backgroundColor: "red",
                  transform: "translate(-50%, -50%) rotate(0deg)",
                }}
              ></div>
              {/* Vertical part of the crosshair */}
              <div
                style={{
                  position: "absolute",
                  width: "20px",
                  height: "2px",
                  backgroundColor: "red",
                  transform: "translate(-50%, -50%) rotate(90deg)",
                }}
              ></div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ImageDisplayCoordinate;
