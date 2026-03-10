import { useReducer, useCallback, useRef } from 'react';

// --- UPDATED: Reducer with a RESET action ---
const initialState = {
    progress: 0,
    isUploading: false,
    error: null,
    url: null,
};

function uploadReducer(state, action) {
    switch (action.type) {
        case 'UPLOAD_START':
            return { ...initialState, isUploading: true };
        case 'SET_PROGRESS':
            return { ...state, progress: action.payload };
        case 'UPLOAD_SUCCESS':
            return { ...state, isUploading: false, url: action.payload };
        case 'UPLOAD_ERROR':
            return { ...state, isUploading: false, error: action.payload };
        case 'CANCEL_UPLOAD':
        case 'RESET': // RESET action also returns to the initial state
            return { ...initialState };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

export const useCloudinaryUpload = () => {
    const [state, dispatch] = useReducer(uploadReducer, initialState);
    const xhrRef = useRef(null);

    const upload = useCallback((file, { allowedTypes, maxSizeMB }) => {
        return new Promise((resolve, reject) => {
            const cloudName =
                import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmoiun16g';
            const uploadPreset =
                import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'blog_unsigned_uploads';

            if (!cloudName || !uploadPreset) {
                const err = "Cloudinary credentials are not configured in .env file.";
                dispatch({ type: 'UPLOAD_ERROR', payload: err });
                return reject(new Error(err));
            }

            dispatch({ type: 'UPLOAD_START' });

            // File Validation
            if (!allowedTypes.includes(file.type)) {
                const err = `Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
                dispatch({ type: 'UPLOAD_ERROR', payload: err });
                return reject(new Error(err));
            }
            if (file.size > maxSizeMB * 1024 * 1024) {
                const err = `File size exceeds the ${maxSizeMB}MB limit.`;
                dispatch({ type: 'UPLOAD_ERROR', payload: err });
                return reject(new Error(err));
            }

            // Prepare and send the request
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;

            const resourceType = file.type.startsWith('image/')
                ? 'image'
                : file.type.startsWith('video/') || file.type.startsWith('audio/')
                    ? 'video'
                    : 'raw';
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
            xhr.open('POST', url, true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    dispatch({ type: 'SET_PROGRESS', payload: percent });
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    dispatch({ type: 'UPLOAD_SUCCESS', payload: response.secure_url });
                    resolve(response.secure_url);
                } else {
                    const errText = JSON.parse(xhr.responseText).error.message;
                    dispatch({ type: 'UPLOAD_ERROR', payload: errText });
                    reject(new Error(errText));
                }
            };

            xhr.onerror = () => {
                const err = 'Upload failed due to a network error.';
                dispatch({ type: 'UPLOAD_ERROR', payload: err });
                reject(new Error(err));
            };

            xhr.onabort = () => {
                dispatch({ type: 'CANCEL_UPLOAD' });
                reject(new Error('Upload was canceled.'));
            };

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            xhr.send(formData);
        });
    }, []);

    const cancelUpload = useCallback(() => {
        if (xhrRef.current) {
            xhrRef.current.abort();
        }
    }, []);

    // --- UPDATED: Added a function to reset the state ---
    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    // Return the new reset function along with other state and functions
    return { ...state, upload, cancelUpload, reset };
};
