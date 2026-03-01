import PropTypes from 'prop-types';
import { useState } from 'react';
import { AiFillGoogleCircle } from 'react-icons/ai';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

export default function OAuth({ className = '', mode = 'signin' }) {
    const auth = getAuth(app);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleGoogleClick = async () => {
        setLoading(true);
        setErrorMessage('');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            const resultsFromGoogle = await signInWithPopup(auth, provider);
            const res = await apiFetch('/api/v1/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: resultsFromGoogle.user.displayName,
                    email: resultsFromGoogle.user.email,
                    googlePhotoUrl: resultsFromGoogle.user.photoURL,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || 'Google sign-in failed.');
            }
            dispatch(signInSuccess(data));
            navigate('/');
        } catch (error) {
            setErrorMessage(error?.message || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {loading ? (
                    <HiOutlineArrowPath className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                    <AiFillGoogleCircle className="h-5 w-5 text-rose-300" aria-hidden />
                )}
                {loading ? 'Connecting to Google...' : label}
            </button>
            {errorMessage ? (
                <p className="mt-2 text-xs text-rose-300">{errorMessage}</p>
            ) : null}
        </div>
    );
}

OAuth.propTypes = {
    className: PropTypes.string,
    mode: PropTypes.oneOf(['signin', 'signup']),
};
