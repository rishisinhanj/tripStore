import React, { useRef, useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';

export default function Profile() {
  const { currentUser } = useAuth();
  const currentPasswordRef = useRef();
  const newPasswordRef = useRef();
  const newPasswordConfirmRef = useRef();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const currentPassword = currentPasswordRef.current.value;
    const newPassword = newPasswordRef.current.value;
    const newPasswordConfirm = newPasswordConfirmRef.current.value;

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      return setError('Please fill in all password fields');
    }

    if (newPassword !== newPasswordConfirm) {
      return setError('New passwords do not match');
    }

    if (newPassword.length < 6) {
      return setError('New password must be at least 6 characters long');
    }

    if (!currentUser) {
      return setError('No authenticated user');
    }

    setLoading(true);

    try {
      // Reauthenticate the user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      setMessage('Password updated successfully');

      // Clear inputs
      currentPasswordRef.current.value = '';
      newPasswordRef.current.value = '';
      newPasswordConfirmRef.current.value = '';
    } catch (err) {
      console.error('Failed to update password', err);
      // Map common errors to friendlier messages
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setError('New password is too weak');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please sign in again and try updating your password');
      } else {
        setError(err.message || 'Failed to update password');
      }
    }

    setLoading(false);
  }

  return (
    <div className="flight-search-container">
      <div className="flight-search-header">
        <div className="header-content">
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1>Profile</h1>
          <p>View and update your account information</p>
        </div>
      </div>

      <div className="search-form-container">
        <div className="flight-search-form">
          {error && <div className="error-alert">{error}</div>}
          {message && <div className="success-alert">{message}</div>}

          <form onSubmit={handlePasswordUpdate} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={currentUser?.email || ''}
                disabled
                className="readonly-input"
              />
            </div>

            <hr className="divider" />

            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input
                type="password"
                id="current-password"
                ref={currentPasswordRef}
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                ref={newPasswordRef}
                required
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password-confirm">Confirm New Password</label>
              <input
                type="password"
                id="new-password-confirm"
                ref={newPasswordConfirmRef}
                required
                placeholder="Re-type new password"
              />
            </div>

            <button disabled={loading} type="submit" className="btn-primary">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}