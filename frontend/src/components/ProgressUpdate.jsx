import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function ProgressUpdate() {
    const {
        goHome, frozenCycle, memberPlans, currentUserId, taskAssignments,
        getEntry, catLabel, statusLabel, uid, save, showToast,
        setProgressUpdates, taskAssignments: allTAs
    } = useAppContext();

    const cycle = frozenCycle();

    const [progressModal, setProgressModal] = useState(false);
    const [progressTA, setProgressTA] = useState(null);
    const [progForm, setProgForm] = useState({ hours: '', status: '', note: '' });
    const [progError, setProgError] = useState('');

    const myFrozenAssignments = () => {
        if (!cycle) return [];
        const p = memberPlans.find(pp => pp.cycleId === cycle.id && pp.memberId === currentUserId);
        if (!p) return [];
        const a = taskAssignments.filter(t => t.memberPlanId === p.id);
        const order = { BLOCKED: 0, IN_PROGRESS: 1, NOT_STARTED: 2, COMPLETED: 3 };
        return a.sort((x, y) => (order[x.progressStatus] || 9) - (order[y.progressStatus] || 9));
    };

    const myCompletedHours = () => myFrozenAssignments().reduce((s, t) => s + t.hoursCompleted, 0);

    const startProgressUpdate = (ta) => {
        setProgressTA(ta);
        setProgForm({ hours: ta.hoursCompleted, status: ta.progressStatus, note: '' });
        setProgError('');
        setProgressModal(true);
    };

    const allowedStatuses = () => {
        if (!progressTA) return [];
        const s = progressTA.progressStatus;
        const map = {
            NOT_STARTED: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED'],
            IN_PROGRESS: ['IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
            BLOCKED: ['BLOCKED', 'IN_PROGRESS'],
            COMPLETED: ['COMPLETED', 'IN_PROGRESS']
        };
        return map[s] || [];
    };

    const submitProgress = () => {
        setProgError('');
        const f = progForm;
        const ta = progressTA;
        const h = parseFloat(f.hours) || 0;

        if (h < 0) { setProgError("Hours can't be less than zero."); return; }
        if (h % 0.5 !== 0) { setProgError('Please enter hours in half-hour steps.'); return; }
        if (f.note && f.note.length > 1000) { setProgError('Notes can be up to 1000 letters.'); return; }

        // Auto-status
        let finalStatus = f.status;
        if (h > 0 && ta.progressStatus === 'NOT_STARTED' && finalStatus === 'NOT_STARTED') finalStatus = 'IN_PROGRESS';

        // Validate transition
        const invalid = (ta.progressStatus === 'NOT_STARTED' && finalStatus === 'COMPLETED') ||
            (ta.progressStatus === 'BLOCKED' && finalStatus === 'COMPLETED');
        if (invalid) { setProgError('Please set this to "In Progress" first, then mark it as "Completed" after.'); return; }

        setProgressUpdates(prev => [...prev, {
            id: uid(),
            taskAssignmentId: ta.id,
            timestamp: new Date().toISOString(),
            previousHoursCompleted: ta.hoursCompleted,
            newHoursCompleted: h,
            previousStatus: ta.progressStatus,
            newStatus: finalStatus,
            note: f.note || '',
            updatedBy: currentUserId
        }]);

        const real = allTAs.find(t => t.id === ta.id);
        if (real) {
            real.hoursCompleted = h;
            real.progressStatus = finalStatus;
            save();
        }

        setProgressModal(false);
        showToast('Progress saved!');
    };

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={goHome}>← Home</button>
            <h2 className="title is-4">Update My Progress</h2>
            <p className="text-secondary mb-2">Week of {cycle?.planningDate}. Your plan: 30 hours.</p>

            <div className="notification is-app-info mb-4">
                You've completed <strong>{myCompletedHours()}</strong> of 30 hours (<strong>{Math.round(myCompletedHours() / 30 * 100)}</strong>%)
                <div className="progress-bar-outer mt-2">
                    <div className="progress-bar-inner is-ok" style={{ width: `${Math.min(100, myCompletedHours() / 30 * 100)}%` }}></div>
                </div>
            </div>

            {myFrozenAssignments().map(ta => {
                const entry = getEntry(ta.backlogEntryId);
                return (
                    <div className={`box mb-2 ${ta.hoursCompleted > ta.committedHours ? 'overage' : ''}`} key={ta.id}>
                        <div className="columns is-vcentered is-multiline">
                            <div className="column">
                                <strong>{entry?.title}</strong>
                                <span className={`tag is-cat ml-1 cat-badge-${entry?.category}`}>{catLabel(entry?.category)}</span>
                                <span className={`tag ml-1 stat-badge-${ta.progressStatus}`}>{statusLabel(ta.progressStatus)}</span>
                            </div>
                            <div className="column">
                                <span>{ta.hoursCompleted} of {ta.committedHours}h done</span>
                                {ta.hoursCompleted > ta.committedHours && (
                                    <span className="has-text-warning"> (over by {ta.hoursCompleted - ta.committedHours}h)</span>
                                )}
                                <div className="progress-bar-outer mt-1">
                                    <div
                                        className={`progress-bar-inner ${ta.hoursCompleted > ta.committedHours ? 'is-over' : 'is-ok'}`}
                                        style={{ width: `${Math.min(100, (ta.hoursCompleted / Math.max(1, ta.committedHours)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="column is-narrow">
                                <button className="button is-small btn-primary" onClick={() => startProgressUpdate(ta)}>
                                    Update This Task
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Progress Modal */}
            {progressModal && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={() => setProgressModal(false)}></div>
                    <div className="modal-card">
                        <header className="modal-card-head">
                            <p className="modal-card-title">Update: {getEntry(progressTA?.backlogEntryId)?.title || ''}</p>
                            <button className="delete" onClick={() => setProgressModal(false)}></button>
                        </header>
                        <section className="modal-card-body">
                            <p className="mb-3">
                                Committed: <strong>{progressTA?.committedHours}h</strong>. Currently: <strong>{progressTA?.hoursCompleted}h</strong> done.
                            </p>

                            <div className="field">
                                <label className="label">Hours completed</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        type="number"
                                        value={progForm.hours}
                                        onChange={e => setProgForm({ ...progForm, hours: e.target.value })}
                                        step="0.5"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Status</label>
                                <div className="control">
                                    <div className="select">
                                        <select
                                            value={progForm.status}
                                            onChange={e => setProgForm({ ...progForm, status: e.target.value })}
                                        >
                                            {allowedStatuses().map(opt => (
                                                <option key={opt} value={opt}>{statusLabel(opt)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Note (optional)</label>
                                <div className="control">
                                    <textarea
                                        className="textarea"
                                        value={progForm.note}
                                        onChange={e => setProgForm({ ...progForm, note: e.target.value })}
                                        placeholder="Add a note about this task"
                                        maxLength="1000"
                                    ></textarea>
                                </div>
                            </div>

                            {parseFloat(progForm.hours) > progressTA?.committedHours && (
                                <p className="help has-text-warning">You've put in more hours than you planned. That's okay — this will be noted.</p>
                            )}
                            {progError && <p className="help has-text-danger">{progError}</p>}
                        </section>
                        <footer className="modal-card-foot">
                            <button className="button btn-primary" onClick={submitProgress}>Save Progress</button>
                            <button className="button btn-secondary" onClick={() => setProgressModal(false)}>Cancel</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
