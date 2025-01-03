import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { Button, Typography, Box, CssBaseline, Snackbar, Alert, LinearProgress } from "@mui/material";

import ImageDisplayCoordinate from "../components/ImageDisplayCoordinate";
import ImageDisplaySegmentation from "../components/ImageDisplaySegmentation";
import VideoDisplaySegmentation from "../components/VideoDisplaySegmentationSample";
import NavigationButtons from "../components/NavigationButtons";
import Controls from "../components/Controls";
import ProgressBar from "../components/ProgressBar";
import ThumbnailGrid from "../components/ThumbnailGrid";
import { AuthContext } from "../AuthContext";

function ProjectDetailPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { logoutUser } = useContext(AuthContext);

    const [project, setProject] = useState(null);
    const [modelType, setModelType] = useState("video_tracking_segmentation"); // Default type
    const [images, setImages] = useState([]);
    const [coordinates, setCoordinates] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [files, setFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [masks, setMasks] = useState({});
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axiosInstance.get(`projects/${projectId}/`);

                const coordinatesMap = {};
                response.data.images.forEach((image) => {
                    if (image.coordinates && image.coordinates.length > 0) {
                        coordinatesMap[image.id] = image.coordinates.map((coord) => ({
                            x: coord.x,
                            y: coord.y,
                        }));
                    }
                });

                setCoordinates(coordinatesMap);
                setProject(response.data);
                setModelType(response.data.type);
                setImages(response.data.images);
            } catch (error) {
                console.error("Error fetching project details:", error);
                setNotification({
                    open: true,
                    message: "Error fetching project details.",
                    severity: "error",
                });
            }
        };

        fetchProject();
    }, [projectId]);


    useEffect(() => {
    }, [images]);
    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "a") {
                handlePrevImage();
            } else if (event.key === "d") {
                handleNextImage();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [currentIndex, images]);

    // Function to select and upload images
    const handleSelectFolder = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = modelType === "video_tracking_segmentation" ? "video/*" : "image/*";
        input.onchange = async (event) => {
            const selectedFiles = Array.from(event.target.files);
            const filteredFiles = selectedFiles.filter((file) =>
                modelType === "video_tracking_segmentation" 
                    ? file.type.startsWith("video/")
                    : file.type.startsWith("image/")
            );
            setFiles(filteredFiles);
            setCurrentIndex(0);
            setCoordinates({});

            // Batch upload files
            const batchSize = 50; // Adjust based on your needs and server capacity
            setLoading(true);
            for (let i = 0; i < filteredFiles.length; i += batchSize) {
                const batchFiles = filteredFiles.slice(i, i + batchSize);

                // Create FormData for the batch
                const formData = new FormData();
                formData.append("project_id", projectId);
                batchFiles.forEach((file) => {
                    formData.append("images", file);
                });

                // Upload the batch
                try {
                    const response = await axiosInstance.post(
                        `images/`,
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );
                    if (response.data) {
                        setImages((prevImages) => [...prevImages, ...response.data]);
                    }
                } catch (error) {
                    console.error("Error uploading batch: ", error);
                    setNotification({
                        open: true,
                        message: "Error uploading batch",
                        severity: "error",
                    });
                }
            }
            setLoading(false);
        };
        input.click();
    };

    // Navigation functions
    const handleNextImage = () => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
        }
    };

    const handlePrevImage = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prevIndex) => prevIndex - 1);
        }
    };

    const handleThumbnailClick = (index) => {
        setCurrentIndex(index);
    };

    // Function to save coordinates to backend
    const saveCoordinatesToBackend = async () => {
        { console.log(coordinates) }
        const payload = Object.entries(coordinates).map(([imageId, coords]) => ({
            image_id: parseInt(imageId, 10),
            coordinates: coords.map(coord => ({ x: coord.x, y: coord.y })),
        }));

        if (!coordinates) {
            setNotification({
                open: true,
                message: "No coordinates to save.",
                severity: "warning",
            });
            return;
        }
        try {
            await axiosInstance.post(
                `images/save_all_coordinates/`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setNotification({
                open: true,
                message: "Coordinates saved successfully.",
                severity: "success",
            });
        } catch (error) {
            console.error("Error saving coordinates: ", error);
            setNotification({
                open: true,
                message: "Error saving coordinates.",
                severity: "error",
            });
        }
    };

    // Function to download labels as CSV
    const handleSaveLabels = () => {
        const csvContent = [
            ["image_name", "x", "y"],
            ...Object.entries(coordinates).map(([imageId, { x, y }]) => {
                const image = images.find((img) => img.id === parseInt(imageId));
                return [image ? image.image : imageId, x, y];
            }),
        ]
            .map((e) => e.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "labels.csv";
        a.click();
    };

    const handleUseModel = () => {
        if (!projectId) {
            setNotification({
                open: true,
                message: "Project ID is missing.",
                severity: "warning",
            });
            return;
        }

        setProgress(0);

        const socket = new WebSocket("ws://localhost:8000/ws/process-images/");

        socket.onopen = () => {
            console.log("WebSocket connection established.");
            socket.send(
                JSON.stringify({
                    project_id: projectId,
                })
            );
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.status === "success") {
                const { image_id, x, y } = data.coordinates || {};
                const progress = data.progress || 0;
                setProgress(progress);

                if (image_id && x != null && y != null) {
                    setCoordinates((prevCoordinates) => ({
                        ...prevCoordinates,
                        [image_id]: { x, y },
                    }));
                }
            } else if (data.status === "complete") {
                setNotification({
                    open: true,
                    message: "Coordinate labeling completed.",
                    severity: "success",
                });
                socket.close();
            } else if (data.status === "error") {
                console.error("Error from server:", data.message);
                setNotification({
                    open: true,
                    message: `Error: ${data.message}`,
                    severity: "error",
                });
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            setNotification({
                open: true,
                message: "WebSocket error occurred.",
                severity: "error",
            });
            socket.close();
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed.");
            setTimeout(() => {
                setProgress(0);
            }, 3000);
        };
    };

    // Function to clear labels
    const handleClearLabels = () => {
        setCoordinates({});
        setNotification({
            open: true,
            message: "Labels cleared.",
            severity: "info",
        });
    };

    const handleReloadFromDatabase = async () => {
        try {
            const response = await axiosInstance.get(
                `projects/${projectId}/coordinates/`
            );
            if (response.data) {
                const newCoordinates = {};
                response.data.forEach((entry) => {
                    if (entry.image_id && entry.coordinates) {
                        newCoordinates[entry.image_id] = entry.coordinates.map(coord => ({
                            x: coord.x,
                            y: coord.y,
                        }));
                    }
                });
                setCoordinates(newCoordinates);
                setNotification({
                    open: true,
                    message: "Coordinates reloaded from database.",
                    severity: "success",
                });
            }
        } catch (error) {
            console.error("Error reloading coordinates: ", error);
            setNotification({
                open: true,
                message: "Error reloading coordinates.",
                severity: "error",
            });
        }
    };

    // Handle notification close
    const handleNotificationClose = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    const handleCoordinatesChange = (newCoordinate) => {
        setCoordinates((prev) => {
            const prevCoords = prev[images[currentIndex].id] || [];
            if (modelType === "multi_point_coordinate") {
                // Append the new coordinate
                return {
                    ...prev,
                    [images[currentIndex].id]: [...prevCoords, newCoordinate],
                };
            } else {
                // Replace with the new coordinate
                return {
                    ...prev,
                    [images[currentIndex].id]: [newCoordinate],
                };
            }
        });
    };

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                color: "white",
            }}
        >
            <CssBaseline />
            <Box mb={1} pt={2} pl={2} display="flex" alignItems="center">
                <Button variant="contained" color="primary" onClick={handleSelectFolder}>
                    Upload Images
                </Button>
                <Typography variant="h4" color="primary" fontWeight="bold" sx={{ ml: 4 }}>
                    {project ? project.name : "Loading Project..."}
                </Typography>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={logoutUser}
                    sx={{ ml: "auto", mr: 2 }}
                >
                    Logout
                </Button>
            </Box>
            {loading && <LinearProgress />}
            {images.length > 0 ? (
                <Box
                    display="flex"
                    flexGrow={1}
                    p={2}
                    height="100vh"
                    overflow="auto"
                >
                    <Box width="350px" overflow="auto">
                        <ThumbnailGrid
                            images={images}
                            onThumbnailClick={handleThumbnailClick}
                            currentIndex={currentIndex}
                            coordinates={coordinates}
                            files={files}
                        />
                    </Box>
                    <Box
                        flexGrow={1}
                        ml={2}
                        display="flex"
                        flexDirection="column"
                        overflow="hidden"
                    >
                        <Box
                            display="flex"
                            flexDirection="row"
                            flexGrow={1}
                            overflow="auto"
                        >
                            <Box
                                display="flex"
                                flexDirection="column"
                                flexGrow={1}
                                overflow="auto"
                            >
                                <Box flexGrow={1} display="flex" overflow="hidden">
                                    {modelType === "video_tracking_segmentation" ? (
                                        <VideoDisplaySegmentation
                                            image={images[currentIndex]}
                                            previousMask={masks}
                                            onMaskChange={(frame, newMask) => {
                                                setMasks((prevMasks) => ({
                                                    ...prevMasks,
                                                    [frame]: newMask,
                                                }));
                                            }}
                                        />
                                    ) : modelType === "segmentation" ? (
                                        <ImageDisplaySegmentation
                                            image={images[currentIndex]}
                                            previousMask={masks[images[currentIndex].id]}
                                            onMaskChange={(newMask) => {
                                                setMasks((prevMasks) => ({
                                                    ...prevMasks,
                                                    [images[currentIndex].id]: newMask,
                                                }));
                                            }}
                                        />
                                    ) : (
                                        <ImageDisplayCoordinate
                                            image={images[currentIndex]}
                                            coordinates={coordinates || {}}
                                            modelType={modelType}
                                            onCoordinatesChange={handleCoordinatesChange}
                                        />
                                    )}
                                </Box>

                                <Box mr={1}>
                                    <Typography
                                        variant="body1"
                                        color="textSecondary"
                                        fontWeight="bold"
                                    >
                                        {coordinates[images[currentIndex].id] ? (
                                            <>
                                                x:{" "}
                                                {/* {coordinates[images[currentIndex].id][0].x.toFixed(0)} | y:{" "}
                                                {coordinates[images[currentIndex].id][0].y.toFixed(0)} */}
                                            </>
                                        ) : (
                                            "No coordinates available"
                                        )}
                                    </Typography>
                                    <ProgressBar progress={progress} />
                                </Box>
                            </Box>
                            <Box
                                width={60}
                                display="flex"
                                flexDirection="column"
                                justifyContent="center"
                                alignItems="flex-start"
                            >
                                <NavigationButtons
                                    onPrev={handlePrevImage}
                                    onNext={handleNextImage}
                                    disablePrev={currentIndex === 0}
                                    disableNext={currentIndex === images.length - 1}
                                />
                                <Controls
                                    onSaveToDatabase={saveCoordinatesToBackend}
                                    onDownloadLabels={handleSaveLabels}
                                    onUseModel={handleUseModel}
                                    onClearLabels={handleClearLabels}
                                    onReloadFromDatabase={handleReloadFromDatabase}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                    No images loaded. Please upload images.
                </Typography>
            )}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleNotificationClose}
            >
                <Alert
                    onClose={handleNotificationClose}
                    severity={notification.severity}
                    sx={{ width: "100%" }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ProjectDetailPage;
