// ImageDisplayCoordinate.js
import React, { useState } from "react";
import useImageDisplay from "./useImageDisplay";
import CrosshairControls from "./CrosshairControls";

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

  // State variables for crosshair properties
  const [crosshairWidth, setCrosshairWidth] = useState(2); // Default width
  const [crosshairLength, setCrosshairLength] = useState(20); // Default length
  const [crosshairColor, setCrosshairColor] = useState("#ff0000"); // Default color (red)
  const [crosshairShape, setCrosshairShape] = useState("+"); // Default shape

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

  const renderCrosshairShape = (position, index) => {
    const commonStyle = {
      position: "absolute",
      pointerEvents: "none",
      top: `${position.top}px`,
      left: `${position.left}px`,
      transform: "translate(-50%, -50%)",
    };

    switch (crosshairShape) {
      case "+":
        return (
          <div key={index} style={commonStyle}>
            {/* Horizontal line */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairLength}px`,
                height: `${crosshairWidth}px`,
                backgroundColor: crosshairColor,
                transform: "translate(-50%, -50%)",
              }}
            />
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairWidth}px`,
                height: `${crosshairLength}px`,
                backgroundColor: crosshairColor,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        );
      case "x":
        return (
          <div key={index} style={commonStyle}>
            {/* Diagonal line 1 */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairLength}px`,
                height: `${crosshairWidth}px`,
                backgroundColor: crosshairColor,
                transform: `translate(-50%, -50%) rotate(45deg)`,
              }}
            />
            {/* Diagonal line 2 */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairLength}px`,
                height: `${crosshairWidth}px`,
                backgroundColor: crosshairColor,
                transform: `translate(-50%, -50%) rotate(-45deg)`,
              }}
            />
          </div>
        );
      case "full_circle":
        return (
          <div
            key={index}
            style={{
              ...commonStyle,
              width: `${crosshairLength}px`,
              height: `${crosshairLength}px`,
              borderRadius: "50%",
              backgroundColor: crosshairColor,
            }}
          />
        );
      case "empty_circle":
        return (
          <div
            key={index}
            style={{
              ...commonStyle,
              width: `${crosshairLength}px`,
              height: `${crosshairLength}px`,
              borderRadius: "50%",
              border: `${crosshairWidth}px solid ${crosshairColor}`,
              backgroundColor: "transparent",
            }}
          />
        );
      case "star":
        return (
          <div key={index} style={commonStyle}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairWidth}px`,
                height: `${crosshairLength}px`,
                backgroundColor: crosshairColor,
              }}
            />
            {/* Horizontal line */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairLength}px`,
                height: `${crosshairWidth}px`,
                backgroundColor: crosshairColor,
              }}
            />
            {/* Diagonal line 1 */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairLength}px`,
                height: `${crosshairWidth}px`,
                backgroundColor: crosshairColor,
                transform: `rotate(45deg)`,
              }}
            />
            {/* Diagonal line 2 */}
            <div
              style={{
                position: "absolute",
                width: `${crosshairLength}px`,
                height: `${crosshairWidth}px`,
                backgroundColor: crosshairColor,
                transform: `rotate(-45deg)`,
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Crosshair Controls Component */}
      <CrosshairControls
        keepZoomPan={keepZoomPan}
        onToggleKeepZoomPan={handleToggleChange}
        crosshairWidth={crosshairWidth}
        onCrosshairWidthChange={(event, newValue) =>
          setCrosshairWidth(newValue)
        }
        crosshairLength={crosshairLength}
        onCrosshairLengthChange={(event, newValue) =>
          setCrosshairLength(newValue)
        }
        crosshairColor={crosshairColor}
        onCrosshairColorChange={(event) =>
          setCrosshairColor(event.target.value)
        }
        crosshairShape={crosshairShape}
        onCrosshairShapeChange={(event) =>
          setCrosshairShape(event.target.value)
        }
      />

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
            pointerEvents: "none",
          }}
        />

        {/* Display crosshairs at the labeled coordinates if available */}
        {coordinates[image.id] &&
          crosshairPositions.map((position, index) =>
            renderCrosshairShape(position, index)
          )}
      </div>
    </div>
  );
};

export default ImageDisplayCoordinate;
