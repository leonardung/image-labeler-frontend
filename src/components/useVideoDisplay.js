import { useState, useRef, useEffect } from "react";

const useVideoDisplay = (base_video) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [vidDimensions, setVidDimensions] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [ShiftKeyPress, setShiftKeyPress] = useState(false);
  const [keepZoomPan, setKeepZoomPan] = useState(false);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);

  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey) {
        setShiftKeyPress(true);
      }
    };

    const handleKeyUp = (e) => {
      if (!e.shiftKey) {
        setShiftKeyPress(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const calculateDisplayParams = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      setVidDimensions({ width: videoWidth, height: videoHeight });
    }
  };

  const handleWheel = (event) => {
    event.preventDefault(); // Prevent default browser zoom behavior

    if (!containerRef.current) return;

    const { clientX, clientY } = event;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = clientX - containerRect.left;
    const y = clientY - containerRect.top;

    // Determine the new zoom level
    const delta = event.deltaY;
    let newZoomLevel = zoomLevel * (delta > 0 ? 0.85 : 1.15);
    newZoomLevel = Math.max(0.25, Math.min(newZoomLevel, 5)); // Limit zoom level

    const zoomFactor = newZoomLevel / zoomLevel;

    // Adjust pan offset to keep the image centered on the cursor
    const newPanOffsetX = x - (x - panOffset.x) * zoomFactor;
    const newPanOffsetY = y - (y - panOffset.y) * zoomFactor;

    setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    setZoomLevel(newZoomLevel);
  };

  const handleMouseDown = (e) => {
    if (ShiftKeyPress) {
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleToggleChange = (e) => {
    setKeepZoomPan(e.target.checked);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setTotalFrames(Math.floor(base_video.total_frames));
      calculateDisplayParams();
    };

    const handleTimeUpdate = () => {
      setCurrentFrame(Math.floor(video.currentTime * base_video.frame_rate));
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [base_video.image]);

  const handleProgressHover = (e) => {
    if (!containerRef.current || !videoRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const hoverTime = (x / width) * videoRef.current.duration;
    setPreviewTime(hoverTime);
    setPreviewPosition({ x: e.clientX, y: e.clientY });
    setShowPreview(true);
  };

  return {
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
    calculateDisplayParams,
    currentFrame,
    setCurrentFrame,
    totalFrames,
    showPreview,
    setShowPreview,
    previewTime,
    previewPosition,
    handleProgressHover,
  };
};

export default useVideoDisplay;
