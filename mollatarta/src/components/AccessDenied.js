import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AccessDenied.css';

export default function AccessDenied() {
  const { t } = useTranslation();
  
  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">🔒</div>
        <h1>{t('errors.access_denied')}</h1>
        <p>{t('errors.no_permission')}</p>
        <div className="access-denied-actions">
          <Link to="/" className="primary-button">
            {t('errors.go_home')}
          </Link>
        </div>
      </div>
    </div>
  );
} 