import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

// Flag icons (simple emoji-based for now)
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'al', name: 'Albanian', flag: '🇦🇱' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language || 'en';
  
  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    // Store the language preference
    localStorage.setItem('i18nextLng', languageCode);
  };

  return (
    <div className="language-switcher">
      {LANGUAGES.map(({ code, name, flag }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={`lang-button ${currentLanguage === code ? 'active' : ''}`}
          title={name}
        >
          <span className="flag-icon">{flag}</span>
        </button>
      ))}
    </div>
  );
} 