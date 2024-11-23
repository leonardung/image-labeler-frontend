import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../axiosInstance';
import {
    Button,
    Typography,
    Box,
    CssBaseline,
    Snackbar,
    Alert,
    LinearProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

// Import or create these components based on your original code
import ImageDisplayCoordinate from '../components/ImageDisplayCoordinate';
import ImageDisplaySegmentation from '../components/ImageDisplaySegmentation';
import NavigationButtons from '../components/NavigationButtons';
import Controls from '../components/Controls';
import ProgressBar from '../components/ProgressBar';
import ThumbnailGrid from '../components/ThumbnailGrid';

const ProjectDetailPage = () => {
    const { id } = useParams(); // Get project ID from URL parameters
    const { authTokens } = useContext(AuthContext);
    const [project, setProject] = useState(null);
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [coordinates, setCoordinates] = useState({});
    const { logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [modelType, setModelType] = useState('segmentation');
    const [masks, setMasks] = useState({});
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const fetchProjectDetails = async () => {
        try {
            const response = await axiosInstance.get(`projects/${id}/`);
            setProject(response.data);
            setImages(response.data.images);
        } catch (error) {
            console.error('Error fetching project details:', error);
            setNotification({
                open: true,
                message: 'Error fetching project details.',
                severity: 'error',
            });
        }
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
        const image = images[currentIndex];
        const coords = coordinates[image.id];

        if (!coords) {
            setNotification({
                open: true,
                message: 'No coordinates to save.',
                severity: 'warning',
            });
            return;
        }

        try {
            await axiosInstance.post(`images/${image.id}/coordinates/`, coords);
            setNotification({
                open: true,
                message: 'Coordinates saved successfully.',
                severity: 'success',
            });
        } catch (error) {
            console.error('Error saving coordinates: ', error);
            setNotification({
                open: true,
                message: 'Error saving coordinates.',
                severity: 'error',
            });
        }
    };

    // Function to handle image upload
    const handleUploadImages = async (event) => {
        const files = event.target.files;
        if (!files.length) return;

        const formData = new FormData();
        for (const file of files) {
            formData.append('image', file);
        }
        formData.append('project_id', id);

        setLoading(true);
        try {
            await axiosInstance.post('images/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            fetchProjectDetails(); // Refresh images
            setNotification({
                open: true,
                message: 'Images uploaded successfully.',
                severity: 'success',
            });
        } catch (error) {
            console.error('Error uploading images:', error);
            setNotification({
                open: true,
                message: 'Error uploading images.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to download labels as CSV
    const handleSaveLabels = () => {
        const csvContent = [
            ['image_name', 'x', 'y'],
            ...Object.entries(coordinates).map(([imageId, { x, y }]) => {
                const image = images.find((img) => img.id === parseInt(imageId));
                return [image?.image || 'Unknown', x, y];
            }),
        ]
            .map((e) => e.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'labels.csv';
        a.click();
    };

    // Function to handle model processing (e.g., use AI model to label images)
    const handleUseModel = () => {
        // Implement model processing logic here
        setNotification({
            open: true,
            message: 'Model processing started.',
            severity: 'info',
        });
    };

    // Function to clear labels
    const handleClearLabels = () => {
        setCoordinates({});
        setNotification({
            open: true,
            message: 'Labels cleared.',
            severity: 'info',
        });
    };

    // Function to reload labels from the database
    const handleReloadFromDatabase = async () => {
        try {
            const response = await axiosInstance.get(
                `images/${images[currentIndex].id}/coordinates/`
            );
            setCoordinates((prev) => ({
                ...prev,
                [images[currentIndex].id]: response.data,
            }));
            setNotification({
                open: true,
                message: 'Coordinates reloaded from database.',
                severity: 'success',
            });
        } catch (error) {
            console.error('Error reloading coordinates: ', error);
            setNotification({
                open: true,
                message: 'Error reloading coordinates.',
                severity: 'error',
            });
        }
    };

    // Handle notification close
    const handleNotificationClose = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    if (!project) {
        return (
            <Typography variant="h6" align="center">
                Loading project details...
            </Typography>
        );
    }

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                // background:
                //   'linear-gradient(135deg, rgb(220,220,255) 0%, rgb(210,210,255) 100%)',
                color: 'white',
            }}
        >
            <CssBaseline />
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box mb={1} pt={2} pl={2} display="flex" alignItems="center">
                    <Typography variant="h4" color="textPrimary">
                        {project.name}
                    </Typography>
                    <Button
                        variant="contained"
                        component="label"
                        color="primary"
                        sx={{ ml: 2 }}
                    >
                        Upload Images
                        <input
                            type="file"
                            hidden
                            multiple
                            accept="image/*"
                            onChange={handleUploadImages}
                        />
                    </Button>
                </Box>
                <Box mr={2}>
                    <Button variant="outlined" color="secondary" onClick={handleLogout}>
                        Logout
                    </Button>
                </Box>
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
                                    {project.type === 'segmentation' ? (
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
                                            coordinates={coordinates}
                                            onCoordinatesChange={(newCoordinates) =>
                                                setCoordinates((prev) => ({
                                                    ...prev,
                                                    [images[currentIndex].id]: newCoordinates,
                                                }))
                                            }
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
                                                x: {coordinates[images[currentIndex].id].x.toFixed(0)} | y:{' '}
                                                {coordinates[images[currentIndex].id].y.toFixed(0)}
                                            </>
                                        ) : (
                                            'No coordinates available'
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
                    No images uploaded for this project.
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
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProjectDetailPage;
