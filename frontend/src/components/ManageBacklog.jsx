import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function ManageBacklog() {
    const {
        view, setView, goHome, backlogEntries, setBacklogEntries, catLabel, currentUserId,
        uid, save, showToast, showError, showConfirm, isLead
    } = useAppContext();

    const [blFilter, setBlFilter] = useState({ client: true, tech: true, rd: true, status: '', search: '' });
    const [editEntry, setEditEntry] = useState(null);
    const [backlogForm, setBacklogForm] = useState({ title: '', description: '', category: '', estimatedEffort: '' });
    const [backlogError, setBacklogError] = useState('');

    const filteredBacklog = () => {
        let entries = [...backlogEntries];
        const cats = [];
        if (blFilter.client) cats.push('CLIENT_FOCUSED');
        if (blFilter.tech) cats.push('TECH_DEBT');
        if (blFilter.rd) cats.push('R_AND_D');

        entries = entries.filter(e => cats.includes(e.category));

        if (!blFilter.status) entries = entries.filter(e => e.status === 'AVAILABLE' || e.status === 'IN_PLAN');
        else if (blFilter.status !== 'ALL') entries = entries.filter(e => e.status === blFilter.status);

        if (blFilter.search) {
            const s = blFilter.search.toLowerCase();
            entries = entries.filter(e => e.title.toLowerCase().includes(s));
        }
        return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    };

    const startEditEntry = (e) => {
        setEditEntry(e);
        setBacklogForm({ title: e.title, description: e.description, category: e.category, estimatedEffort: e.estimatedEffort || '' });
        setBacklogError('');
        setView('backlogEdit');
    };

    const saveBacklogEntry = () => {
        setBacklogError('');
        const f = backlogForm;
        if (!f.title.trim()) { setBacklogError('Please give this item a title.'); return; }
        if (f.title.length > 200) { setBacklogError('Title is too long.'); return; }
        if (!editEntry && !f.category) { setBacklogError('Please pick a category.'); return; }

        const eff = f.estimatedEffort === '' || f.estimatedEffort === null ? null : parseFloat(f.estimatedEffort);
        if (eff !== null && (eff < 0 || isNaN(eff))) { setBacklogError("Hours can't be less than zero."); return; }
        if (eff !== null && eff % 0.5 !== 0) { setBacklogError('Please enter hours in half-hour steps.'); return; }

        if (editEntry) {
            setBacklogEntries(backlogEntries.map(e => {
                if (e.id === editEntry.id) {
                    return { ...e, title: f.title.trim(), description: f.description, estimatedEffort: eff };
                }
                return e;
            }));
        } else {
            setBacklogEntries([...backlogEntries, {
                id: uid(), title: f.title.trim(), description: f.description, category: f.category,
                status: 'AVAILABLE', estimatedEffort: eff, createdBy: currentUserId, createdAt: new Date().toISOString()
            }]);
        }

        save();
        showToast(editEntry ? 'Changes saved!' : 'Backlog item saved!');
        setView('backlog');
    };

    const archiveEntry = (id) => {
        const e = backlogEntries.find(x => x.id === id);
        if (e.status === 'IN_PLAN') { showError('This item is part of an active plan.'); return; }

        showConfirm(
            `Archive "${e.title}"?`,
            'It will be moved to the archived list.',
            () => {
                setBacklogEntries(backlogEntries.map(entry => entry.id === id ? { ...entry, status: 'ARCHIVED' } : entry));
                save();
                showToast('Archived!');
            },
            'Yes, Archive It',
            true
        );
    };

    if (view === 'backlogEdit') {
        return (
            <div>
                <button className="button btn-secondary mb-4" onClick={() => setView('backlog')}>← Go Back</button>
                <h2 className="title is-4">{editEntry ? 'Edit Backlog Item' : 'Add a New Backlog Item'}</h2>

                <div className="box">
                    <div className="field">
                        <label className="label">Title</label>
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                value={backlogForm.title}
                                onChange={e => setBacklogForm({ ...backlogForm, title: e.target.value })}
                                placeholder="What is this work about?"
                                maxLength="200"
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Description</label>
                        <div className="control">
                            <textarea
                                className="textarea"
                                value={backlogForm.description}
                                onChange={e => setBacklogForm({ ...backlogForm, description: e.target.value })}
                                placeholder="Add more details here (optional)"
                                maxLength="5000"
                            ></textarea>
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Category</label>
                        <div className="control">
                            <div className="select">
                                <select
                                    value={backlogForm.category}
                                    onChange={e => setBacklogForm({ ...backlogForm, category: e.target.value })}
                                    disabled={!!editEntry}
                                >
                                    <option value="">Pick a category</option>
                                    <option value="CLIENT_FOCUSED">Client Focused</option>
                                    <option value="TECH_DEBT">Tech Debt</option>
                                    <option value="R_AND_D">R&D</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Estimated hours (optional)</label>
                        <div className="control">
                            <input
                                className="input"
                                type="number"
                                value={backlogForm.estimatedEffort}
                                onChange={e => setBacklogForm({ ...backlogForm, estimatedEffort: e.target.value })}
                                placeholder="How many hours might this take?"
                                min="0" max="999.5" step="0.5"
                            />
                        </div>
                    </div>

                    {backlogError && <p className="help has-text-danger mb-2">{backlogError}</p>}

                    <div className="field is-grouped">
                        <div className="control">
                            <button className="button btn-primary" onClick={saveBacklogEntry}>Save This Item</button>
                        </div>
                        <div className="control">
                            <button className="button btn-secondary" onClick={() => setView('backlog')}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // view === 'backlog'
    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={goHome}>← Home</button>
            <h2 className="title is-4">Manage Backlog</h2>

            <button
                className="button btn-primary mb-4"
                onClick={() => {
                    setEditEntry(null);
                    setBacklogForm({ title: '', description: '', category: '', estimatedEffort: '' });
                    setView('backlogEdit');
                }}
            >
                Add a New Backlog Item
            </button>

            <div className="field is-grouped is-grouped-multiline mb-3">
                <div className="control">
                    <button
                        className={`button is-small ${blFilter.client ? 'cat-badge-CLIENT_FOCUSED' : 'btn-secondary'}`}
                        onClick={() => setBlFilter({ ...blFilter, client: !blFilter.client })}
                    >
                        Client Focused
                    </button>
                </div>
                <div className="control">
                    <button
                        className={`button is-small ${blFilter.tech ? 'cat-badge-TECH_DEBT' : 'btn-secondary'}`}
                        onClick={() => setBlFilter({ ...blFilter, tech: !blFilter.tech })}
                    >
                        Tech Debt
                    </button>
                </div>
                <div className="control">
                    <button
                        className={`button is-small ${blFilter.rd ? 'cat-badge-R_AND_D' : 'btn-secondary'}`}
                        onClick={() => setBlFilter({ ...blFilter, rd: !blFilter.rd })}
                    >
                        R&D
                    </button>
                </div>
            </div>

            <div className="field is-grouped mb-3">
                <div className="control">
                    <div className="select is-small">
                        <select value={blFilter.status} onChange={e => setBlFilter({ ...blFilter, status: e.target.value })}>
                            <option value="">Available Only</option>
                            <option value="ALL">Show All</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                </div>
                <div className="control is-expanded">
                    <input
                        className="input is-small"
                        type="text"
                        value={blFilter.search}
                        onChange={e => setBlFilter({ ...blFilter, search: e.target.value })}
                        placeholder="Search by title"
                    />
                </div>
            </div>

            {filteredBacklog().map(e => (
                <div className="box mb-2" key={e.id}>
                    <div className="columns is-vcentered is-mobile is-multiline">
                        <div className="column">
                            <strong>{e.title}</strong>
                            <span className={`tag is-cat ml-1 cat-badge-${e.category}`}>{catLabel(e.category)}</span>
                            <span className="tag is-light ml-1">{e.status}</span>
                            {e.estimatedEffort && <span className="text-secondary is-size-7 ml-1">{e.estimatedEffort}h est.</span>}
                        </div>
                        <div className="column is-narrow">
                            <button className="button is-small btn-secondary mr-1" onClick={() => startEditEntry(e)}>View & Edit</button>
                            {isLead() && (e.status === 'AVAILABLE' || e.status === 'COMPLETED') && (
                                <button className="button is-small btn-danger" onClick={() => archiveEntry(e.id)}>Archive</button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {filteredBacklog().length === 0 && (
                <div className="notification is-app-info">No backlog items match your filters.</div>
            )}
        </div>
    );
}
