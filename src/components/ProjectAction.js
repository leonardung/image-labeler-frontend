import React from 'react';
import { Button, Tooltip, Box } from '@mui/material';
import { Delete, ArrowForward } from '@mui/icons-material';

const IconButtonWithText = ({ title, color, icon, onClick, children, href }) => {
    const buttonStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        minWidth: 'unset',
        height: '38px',
        width: '38px',
        marginTop: '8px',
        marginRight: '8px',
        '& span': {
            display: 'none',
        },
        '&:hover span': {
            display: 'inline',
            marginLeft: '8px',
        },
    };

    const textStyles = {
        display: 'none',
        whiteSpace: 'nowrap',
    };

    return (
        <Tooltip title={title} arrow>
            <Button
                variant="outlined"
                color={color}
                onClick={onClick}
                href={href}
                sx={buttonStyles}
            >
                {icon}
                <span style={textStyles}>{children}</span>
            </Button>
        </Tooltip>
    );
};

const ProjectActions = ({ project, handleOpenDeleteDialog }) => {
    return (
        <Box display="flex" alignItems="center">
            <IconButtonWithText
                title="View Project"
                color="primary"
                icon={<ArrowForward />}
                href={`/projects/${project.id}`}
            >
                View Project
            </IconButtonWithText>
            <IconButtonWithText
                title="Delete Project"
                color="error"
                icon={<Delete />}
                onClick={() => handleOpenDeleteDialog(project)}
            >
                Delete Project
            </IconButtonWithText>
        </Box>
    );
};

export default ProjectActions;
