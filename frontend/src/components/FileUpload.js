import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import authService from '../services/auth';

function FileUpload({ onUploadStart, onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError(null);
        if (onUploadStart) onUploadStart();

        const formData = new FormData();
        formData.append('file', file);

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    ...authService.getAuthHeader(),     
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            // Success - no duplicate
            setUploading(false);
            if (onUploadComplete) {
                onUploadComplete(response.data);
            }
            setError(null);
            
        } catch (error) {
            console.error('Upload error:', error);
            setUploading(false); // Stop uploading state
            
            let errorData = null;
            
            // Check if it's a duplicate error (status 400 with our custom detail)
            if (error.response?.status === 400 && error.response.data?.detail) {
                const detail = error.response.data.detail;
                errorData = {
                    success: false,
                    isDuplicate: true,
                    duplicate_check: {
                        is_duplicate: true,
                        reason: detail.reason || 'Duplicate document detected',
                        original_id: detail.original_document_id
                    },
                    error: detail.reason || 'Duplicate document detected'
                };
            } else {
                // Other errors
                errorData = {
                    success: false,
                    error: error.response?.data?.detail || error.message
                };
            }
            
            // IMPORTANT: Call onUploadComplete with error data so Upload.js can show the result
            if (onUploadComplete) {
                onUploadComplete(errorData);
            }
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        maxSize: 10485760, // 10MB
        multiple: false
    });

    return (
        <div style={styles.container}>
            {/* Dropzone */}
            <div
                {...getRootProps()}
                style={{
                    ...styles.dropzone,
                    ...(isDragActive ? styles.dropzoneActive : {}),
                    ...(uploading ? styles.dropzoneDisabled : {})
                }}
            >
                <input {...getInputProps()} disabled={uploading} />
                {uploading ? (
                    <div style={styles.uploadingContent}>
                        <div style={styles.spinner}></div>
                        <p>Uploading... {progress}%</p>
                        <div style={styles.progressBar}>
                            <div style={{...styles.progressFill, width: `${progress}%`}}></div>
                        </div>
                        <p style={styles.smallText}>AI is extracting data from your document...</p>
                    </div>
                ) : (
                    <>
                        <div style={styles.uploadIcon}>📄</div>
                        {isDragActive ? (
                            <p style={styles.dropText}>Drop the file here...</p>
                        ) : (
                            <>
                                <p style={styles.dropText}>
                                    Drag & drop a file here, or click to select
                                </p>
                                <p style={styles.smallText}>
                                    Supported: PDF, PNG, JPG (Max 10MB)
                                </p>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto'
    },
    dropzone: {
        border: '2px dashed #cccccc',
        borderRadius: '8px',
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#fafafa',
        transition: 'all 0.3s ease'
    },
    dropzoneActive: {
        borderColor: '#007bff',
        backgroundColor: '#e3f2fd'
    },
    dropzoneDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },
    uploadIcon: {
        fontSize: '48px',
        marginBottom: '10px'
    },
    dropText: {
        fontSize: '16px',
        color: '#333',
        marginBottom: '10px'
    },
    smallText: {
        fontSize: '12px',
        color: '#999',
        margin: '5px 0 0 0'
    },
    uploadingContent: {
        textAlign: 'center'
    },
    spinner: {
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #007bff',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 10px'
    },
    progressBar: {
        width: '100%',
        height: '6px',
        backgroundColor: '#f0f0f0',
        borderRadius: '3px',
        marginTop: '10px',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007bff',
        transition: 'width 0.3s ease'
    }
};

// Add keyframes for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default FileUpload;