// Controls.js
import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';

const Controls = ({
  onSaveToDatabase,
  onDownloadLabels,
  onUseModel,
  onClearLabels,
  onReloadFromDatabase,
}) => (
  <Box display="flex" flexDirection="column" alignItems="left" justifyContent="left">
    <Tooltip title="Save Labels to Database" placement="left">
      <IconButton onClick={onSaveToDatabase} color="secondary">
        <SaveIcon fontSize="large" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Download Labels" placement="left">
      <IconButton onClick={onDownloadLabels} color="secondary">
        <DownloadIcon fontSize="large" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Use Model" placement="left">
      <IconButton onClick={onUseModel} color="secondary">
        <AutoAwesomeIcon fontSize="large" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Clear Labels" placement="left">
      <IconButton onClick={onClearLabels} color="secondary">
        <ClearIcon fontSize="large" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Reload from Database" placement="left">
      <IconButton onClick={onReloadFromDatabase} color="secondary">
        <RefreshIcon fontSize="large" />
      </IconButton>
    </Tooltip>
  </Box>
);

export default Controls;
