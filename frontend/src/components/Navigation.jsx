import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function Navigation() {
    const { appSettings, view, currentUserId, currentUserName, isLead, goHome, toggleTheme, theme, setView } = useAppContext();

    if (!appSettings.setupComplete) return null;

    return (
        <nav className="navbar is-app" role="navigation">
            <div className="navbar-brand">
                <a className="navbar-item has-text-weight-bold is-size-5" onClick={goHome}>
                    📋 Weekly Plan Tracker
                </a>
            </div>
            <div className="navbar-end">
                {currentUserId && (
                    <div className="navbar-item">
                        <span className="tag is-light mr-2">{currentUserName()}</span>
                        <span className={`tag ${isLead() ? 'is-warning' : 'is-info'}`}>
                            {isLead() ? 'Lead' : 'Member'}
                        </span>
                    </div>
                )}

                {currentUserId && view !== 'identity' && (
                    <a className="navbar-item" onClick={() => setView('identity')} title="Switch Person">
                        🔄 Switch
                    </a>
                )}

                {view !== 'hub' && view !== 'identity' && view !== 'setup' && (
                    <a className="navbar-item" onClick={goHome} title="Home">
                        🏠 Home
                    </a>
                )}

                <a className="navbar-item" onClick={toggleTheme} title="Toggle theme">
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </a>
            </div>
        </nav>
    );
}
