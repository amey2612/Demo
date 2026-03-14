import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Footer() {
    const {
        appSettings, setAppSettings, teamMembers, setTeamMembers,
        backlogEntries, setBacklogEntries, planningCycles, setPlanningCycles,
        categoryAllocations, setCategoryAllocations, memberPlans, setMemberPlans,
        taskAssignments, setTaskAssignments, progressUpdates, setProgressUpdates,
        showConfirm, showToast, uid, save, currentUserId, setCurrentUserId, setView
    } = useAppContext();

    const [importModal, setImportModal] = useState(false);
    const [importData, setImportData] = useState(null);
    const [importFileName, setImportFileName] = useState('');
    const [importError, setImportError] = useState('');

    if (!appSettings.setupComplete) return null;

    const exportData = () => {
        const data = {
            appName: 'WeeklyPlanTracker',
            dataVersion: 1,
            exportedAt: new Date().toISOString(),
            data: {
                appSettings, teamMembers, backlogEntries, planningCycles,
                categoryAllocations, memberPlans, taskAssignments, progressUpdates
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const d = new Date();
        a.download = `weeklyplantracker-backup-${d.toISOString().slice(0, 10)}-${d.toTimeString().slice(0, 8).replace(/:/g, '')}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('Your data was saved to a file.');
    };

    const handleImportFile = (ev) => {
        setImportError('');
        setImportData(null);
        const f = ev.target.files[0];
        if (!f) return;
        setImportFileName(f.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const d = JSON.parse(e.target.result);
                if (d.appName !== 'WeeklyPlanTracker') { setImportError("This file doesn't look like a backup from this app."); return; }
                if (!d.dataVersion || d.dataVersion > 1) { setImportError('This backup file is from a newer version.'); return; }
                if (!d.data || !d.data.teamMembers || !d.data.backlogEntries) { setImportError('This backup file is missing some data.'); return; }
                setImportData(d);
            } catch {
                setImportError("This file can't be read.");
            }
        };
        reader.readAsText(f);
    };

    const executeImport = () => {
        if (!importData) return;
        const d = importData.data;

        setAppSettings(d.appSettings || { setupComplete: true, dataVersion: 1 });
        setTeamMembers(d.teamMembers || []);
        setBacklogEntries(d.backlogEntries || []);
        setPlanningCycles(d.planningCycles || []);
        setCategoryAllocations(d.categoryAllocations || []);
        setMemberPlans(d.memberPlans || []);
        setTaskAssignments(d.taskAssignments || []);
        setProgressUpdates(d.progressUpdates || []);

        save();
        setImportModal(false);
        setImportData(null);
        setCurrentUserId(null);
        setView('identity');
        showToast('Your data was loaded!')

        // In React, reloading entirely might be safest to guarantee fresh state everywhere if context gets tricky,
        // but the state setters above should cover everything. We'll rely on the setters.
    };

    const seedData = () => {
        showConfirm('Seed Sample Data?', 'This will add sample team members, backlog items, and a planning cycle.', () => {
            const m1 = { id: uid(), name: 'Alice Chen', isLead: true, isActive: true, createdAt: new Date().toISOString() };
            const m2 = { id: uid(), name: 'Bob Martinez', isLead: false, isActive: true, createdAt: new Date().toISOString() };
            const m3 = { id: uid(), name: 'Carol Singh', isLead: false, isActive: true, createdAt: new Date().toISOString() };
            const m4 = { id: uid(), name: 'Dave Kim', isLead: false, isActive: true, createdAt: new Date().toISOString() };

            const newMembers = [m1, m2, m3, m4];
            setTeamMembers(newMembers);

            const entries = [
                { id: uid(), title: 'Customer onboarding redesign', description: 'Revamp the onboarding flow.', category: 'CLIENT_FOCUSED', status: 'AVAILABLE', estimatedEffort: 12, createdBy: m1.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Fix billing invoice formatting', description: 'Some invoices show wrong currency format.', category: 'CLIENT_FOCUSED', status: 'AVAILABLE', estimatedEffort: 4, createdBy: m1.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Customer feedback dashboard', description: 'Build a dashboard showing NPS scores.', category: 'CLIENT_FOCUSED', status: 'AVAILABLE', estimatedEffort: 16, createdBy: m2.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Migrate database to PostgreSQL 16', description: 'Upgrade from PG 14 to PG 16.', category: 'TECH_DEBT', status: 'AVAILABLE', estimatedEffort: 20, createdBy: m1.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Remove deprecated API endpoints', description: 'Clean up v1 API routes.', category: 'TECH_DEBT', status: 'AVAILABLE', estimatedEffort: 8, createdBy: m3.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Add unit tests for payment module', description: 'Coverage is below 50%.', category: 'TECH_DEBT', status: 'AVAILABLE', estimatedEffort: 10, createdBy: m2.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Experiment with LLM-based search', description: 'Prototype semantic search using embeddings.', category: 'R_AND_D', status: 'AVAILABLE', estimatedEffort: 15, createdBy: m1.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Evaluate new caching strategy', description: 'Compare Redis Cluster vs Memcached.', category: 'R_AND_D', status: 'AVAILABLE', estimatedEffort: 6, createdBy: m4.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Build internal CLI tool', description: 'A command-line tool for common dev tasks.', category: 'R_AND_D', status: 'AVAILABLE', estimatedEffort: 8, createdBy: m3.id, createdAt: new Date().toISOString() },
                { id: uid(), title: 'Client SSO integration', description: 'Support SAML-based single sign-on for enterprise clients.', category: 'CLIENT_FOCUSED', status: 'AVAILABLE', estimatedEffort: 18, createdBy: m1.id, createdAt: new Date().toISOString() },
            ];
            setBacklogEntries(entries);
            setPlanningCycles([]);
            setCategoryAllocations([]);
            setMemberPlans([]);
            setTaskAssignments([]);
            setProgressUpdates([]);

            setAppSettings({ setupComplete: true, dataVersion: 1 });
            save();
            setCurrentUserId(null);
            setView('identity');
            showToast('Sample data loaded! Pick a person to get started.');
        }, 'Yes, Load Sample Data');
    };

    const resetEverything = () => {
        showConfirm('Reset Everything?', 'This will erase all your data. This cannot be undone.', () => {
            localStorage.clear();
            window.location.reload();
        }, 'Yes, Erase Everything', true);
    };

    return (
        <>
            <footer className="footer-bar">
                <div className="container has-text-centered" style={{ maxWidth: '960px' }}>
                    <button className="button is-small btn-secondary mr-2" onClick={exportData}>📥 Download My Data</button>
                    <button className="button is-small btn-secondary mr-2" onClick={() => setImportModal(true)}>📤 Load Data from File</button>
                    <button className="button is-small btn-secondary mr-2" onClick={seedData}>🌱 Seed Sample Data</button>
                    <button className="button is-small btn-danger" onClick={resetEverything}>🗑️ Reset App</button>
                </div>
            </footer>

            {/* IMPORT MODAL */}
            {importModal && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={() => setImportModal(false)}></div>
                    <div className="modal-card">
                        <header className="modal-card-head">
                            <p className="modal-card-title">Load Data from a Backup File</p>
                            <button className="delete" onClick={() => setImportModal(false)}></button>
                        </header>
                        <section className="modal-card-body">
                            <p className="mb-3">Pick the backup file you saved before. This will replace all your current data.</p>
                            <div className="field">
                                <div className="file has-name">
                                    <label className="file-label">
                                        <input className="file-input" type="file" accept=".json" onChange={handleImportFile} />
                                        <span className="file-cta"><span className="file-label">Choose file</span></span>
                                        <span className="file-name">{importFileName || 'No file chosen'}</span>
                                    </label>
                                </div>
                            </div>
                            {importError && <p className="help has-text-danger">{importError}</p>}
                        </section>
                        <footer className="modal-card-foot">
                            <button className="button btn-danger" disabled={!importData} onClick={executeImport}>Yes, Replace My Data</button>
                            <button className="button btn-secondary" onClick={() => { setImportModal(false); setImportData(null); setImportFileName(''); }}>Cancel</button>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
}
