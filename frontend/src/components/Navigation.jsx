import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function Navigation() {
    const { appSettings, view, currentUserId, currentUserName, isLead, goHome, toggleTheme, theme, setView } = useAppContext();

    if (!appSettings.setupComplete) return null;

    return (
        <nav className="navbar is-app" role="navigation">
            <div className="navbar-brand">
                <a className="navbar-item has-text-weight-bold is-size-5" onClick={goHome} style={{ cursor: 'pointer', letterSpacing: '-0.01em' }}>
                    📋 Weekly Plan Tracker
                </a>
            </div>

            <div className="navbar-end" style={{ alignItems: 'center', display: 'flex' }}>
                {currentUserId && (
                    <div className="navbar-item" style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                        <span className="navbar-user-name">{currentUserName()}</span>
                        <span className={`navbar-role-badge ${isLead() ? 'is-lead' : 'is-member'}`}>
                            {isLead() ? '★ Lead' : 'Member'}
                        </span>
                    </div>
                )}

                {currentUserId && view !== 'identity' && (
                    <a className="navbar-item" onClick={() => setView('identity')} title="Switch Person" style={{ cursor: 'pointer' }}>
                        🔄 Switch
                    </a>
                )}

                {view !== 'hub' && view !== 'identity' && view !== 'setup' && (
                    <a className="navbar-item" onClick={goHome} title="Home" style={{ cursor: 'pointer' }}>
                        🏠 Home
                    </a>
                )}

                <a className="navbar-item" onClick={toggleTheme} title="Toggle theme" style={{ cursor: 'pointer' }}>
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </a>
            </div>
        </nav>
    );
}
