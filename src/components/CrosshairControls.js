// CrosshairControls.js
import React from "react";
import {
    Checkbox,
    FormControlLabel,
    Box,
    Typography,
    Slider,
    Stack,
    Select,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// Import icons
import AddIcon from "@mui/icons-material/Add"; // Plus icon
import Circle from "@mui/icons-material/Circle"; // Full Circle
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"; // Empty Circle
import StarIcon from "@mui/icons-material/Star"; // Star
import ClearIcon from "@mui/icons-material/Clear"; // X

const CrosshairControls = ({
    keepZoomPan,
    onToggleKeepZoomPan,
    crosshairWidth,
    onCrosshairWidthChange,
    crosshairLength,
    onCrosshairLengthChange,
    crosshairColor,
    onCrosshairColorChange,
    crosshairShape,
    onCrosshairShapeChange,
}) => {
    return (
        <Box
            sx={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 1,
                backgroundColor: "rgba(250,250,250, 0.4)",
                borderRadius: 1,
                color: "black",
            }}
        >
            <Accordion elevation={0} square defaultExpanded>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="controls-content"
                    id="controls-header"
                >
                    <Typography sx={{ fontWeight: "bold" }}>Controls</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={1}>
                        {/* Keep Zoom and Pan Checkbox */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={keepZoomPan}
                                    onChange={onToggleKeepZoomPan}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography sx={{ fontWeight: "bold" }}>
                                    Keep Zoom and Pan
                                </Typography>
                            }
                        />

                        {/* Crosshair Shape Selector */}
                        <Typography gutterBottom sx={{ fontWeight: "bold" }}>
                            Crosshair Shape
                        </Typography>
                        <Select
                            value={crosshairShape}
                            onChange={onCrosshairShapeChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                            renderValue={(value) => {
                                let IconComponent;
                                switch (value) {
                                    case "+":
                                        IconComponent = AddIcon;
                                        break;
                                    case "full_circle":
                                        IconComponent = Circle;
                                        break;
                                    case "empty_circle":
                                        IconComponent = RadioButtonUncheckedIcon;
                                        break;
                                    case "star":
                                        IconComponent = StarIcon;
                                        break;
                                    case "x":
                                        IconComponent = ClearIcon;
                                        break;
                                    default:
                                        IconComponent = AddIcon;
                                }
                                return (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <IconComponent />
                                    </Stack>
                                );
                            }}
                        >
                            <MenuItem value="+">
                                <AddIcon />
                            </MenuItem>
                            <MenuItem value="full_circle">
                                <Circle />
                            </MenuItem>
                            <MenuItem value="empty_circle">
                                <RadioButtonUncheckedIcon />
                            </MenuItem>
                            <MenuItem value="star">
                                <StarIcon />
                            </MenuItem>
                            <MenuItem value="x">
                                <ClearIcon />
                            </MenuItem>
                        </Select>

                        {/* Crosshair Width Slider */}
                        <Typography gutterBottom sx={{ fontWeight: "bold" }}>
                            Crosshair Width
                        </Typography>
                        <Slider
                            value={crosshairWidth}
                            onChange={onCrosshairWidthChange}
                            aria-labelledby="crosshair-width-slider"
                            min={1}
                            max={10}
                        />

                        {/* Crosshair Length Slider */}
                        <Typography gutterBottom sx={{ fontWeight: "bold" }}>
                            Crosshair Length
                        </Typography>
                        <Slider
                            value={crosshairLength}
                            onChange={onCrosshairLengthChange}
                            aria-labelledby="crosshair-length-slider"
                            min={10}
                            max={100}
                        />

                        {/* Crosshair Color Picker */}
                        <Typography gutterBottom sx={{ fontWeight: "bold" }}>
                            Crosshair Color
                        </Typography>
                        <input
                            type="color"
                            value={crosshairColor}
                            onChange={onCrosshairColorChange}
                            style={{
                                border: "none",
                                background: "none",
                                padding: 0,
                                width: "36px",
                                height: "36px",
                            }}
                        />
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default CrosshairControls;
