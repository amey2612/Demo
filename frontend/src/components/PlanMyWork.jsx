import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function PlanMyWork() {
    const {
        view, setView, goHome, activeCycle, memberPlans, taskAssignments,
        setTaskAssignments, getCatBudget, getCatClaimed, getEntry, catLabel,
        currentUserId, save, showToast, uid, backlogEntries, planningCycles
    } = useAppContext();

    const [claimCatFilter, setClaimCatFilter] = useState({ CLIENT_FOCUSED: true, TECH_DEBT: true, R_AND_D: true });
    const [claimModal, setClaimModal] = useState(false);
    const [claimEntry, setClaimEntry] = useState(null);
    const [claimHours, setClaimHours] = useState('');
    const [claimError, setClaimError] = useState('');

    const [editingAssignId, setEditingAssignId] = useState(null);
    const [editingAssignHrs, setEditingAssignHrs] = useState('');
    const [assignError, setAssignError] = useState('');

    const myPlan = () => {
        const c = activeCycle();
        return c ? memberPlans.find(p => p.cycleId === c.id && p.memberId === currentUserId) : null;
    };

    const myAssignments = () => {
        const p = myPlan();
        return p ? taskAssignments.filter(t => t.memberPlanId === p.id) : [];
    };

    const myPlannedHours = () => myAssignments().reduce((s, t) => s + t.committedHours, 0);

    const toggleReady = () => {
        const p = myPlan();
        if (p) {
            p.isReady = !p.isReady;
            save();
        }
    };

    const claimableEntries = () => {
        const c = activeCycle();
        if (!c) return [];
        return backlogEntries.filter(e => {
            if (e.status !== 'AVAILABLE' && e.status !== 'IN_PLAN') return false;
            if (!claimCatFilter[e.category]) return false;
            if (e.status === 'IN_PLAN') {
                const otherCycles = planningCycles.filter(cy => cy.id !== c.id && ['PLANNING', 'FROZEN'].includes(cy.state));
                for (const oc of otherCycles) {
                    const pids = memberPlans.filter(p => p.cycleId === oc.id).map(p => p.id);
                    if (taskAssignments.some(t => pids.includes(t.memberPlanId) && t.backlogEntryId === e.id)) return false;
                }
            }
            return true;
        });
    };

    const startClaim = (e) => {
        setClaimEntry(e);
        setClaimHours('');
        setClaimError('');
        setClaimModal(true);
    };

    const submitClaim = () => {
        setClaimError('');
        const h = parseFloat(claimHours);
        if (!h || h <= 0) { setClaimError('Please enter more than 0 hours.'); return; }
        if (h % 0.5 !== 0) { setClaimError('Please enter hours in half-hour steps.'); return; }

        const rem = 30 - myPlannedHours();
        if (h > rem) { setClaimError(`You only have ${rem} hours left.`); return; }

        const catRem = getCatBudget(claimEntry.category) - getCatClaimed(claimEntry.category);
        if (h > catRem) { setClaimError(`The ${catLabel(claimEntry.category)} budget only has ${catRem} hours left.`); return; }

        const p = myPlan();
        setTaskAssignments(prev => [...prev, {
            id: uid(),
            memberPlanId: p.id,
            backlogEntryId: claimEntry.id,
            committedHours: h,
            progressStatus: 'NOT_STARTED',
            hoursCompleted: 0,
            createdAt: new Date().toISOString()
        }]);

        if (claimEntry.status === 'AVAILABLE') claimEntry.status = 'IN_PLAN';
        p.totalPlannedHours = myPlannedHours() + h;
        p.isReady = false;

        save();
        setClaimModal(false);
        showToast(`Added! ${claimEntry.title} — ${h}h`);
        setView('planning');
    };

    const saveAssignHours = (taId) => {
        setAssignError('');
        const ta = taskAssignments.find(t => t.id === taId);
        const newH = parseFloat(editingAssignHrs);
        const oldH = ta.committedHours;
        const delta = newH - oldH;

        if (isNaN(newH) || newH <= 0) { setAssignError('Hours must be more than 0.'); return; }
        if (newH % 0.5 !== 0) { setAssignError('Please enter hours in half-hour steps.'); return; }

        if (delta > 0) {
            const rem = 30 - myPlannedHours();
            if (delta > rem) { setAssignError(`You only have ${rem + oldH} hours you can set here.`); return; }

            const e = getEntry(ta.backlogEntryId);
            const catRem = getCatBudget(e.category) - getCatClaimed(e.category);
            if (delta > catRem) { setAssignError(`The ${catLabel(e.category)} budget only has ${catRem + oldH} hours left.`); return; }
        }

        ta.committedHours = newH;
        myPlan().totalPlannedHours = myPlannedHours();
        myPlan().isReady = false;
        setEditingAssignId(null);
        save();
        showToast('Hours updated!');
    };

    const removeAssignment = (taId) => {
        const ta = taskAssignments.find(t => t.id === taId);
        const e = getEntry(ta.backlogEntryId);

        if (window.confirm(`Remove "${e?.title}"?\nThe ${ta.committedHours} hours will be freed up.`)) {
            setTaskAssignments(prev => prev.filter(t => t.id !== taId));

            const c = activeCycle();
            const pids = memberPlans.filter(p => p.cycleId === c.id).map(p => p.id);
            const still = taskAssignments.some(t => pids.includes(t.memberPlanId) && t.backlogEntryId === e.id);

            if (!still && e.status === 'IN_PLAN') e.status = 'AVAILABLE';

            const p = myPlan();
            p.totalPlannedHours = myPlannedHours();
            p.isReady = false;

            save();
            showToast('Removed!');
        }
    };

    if (view === 'claim') {
        return (
            <div>
                <button className="button btn-secondary mb-4" onClick={() => setView('planning')}>← Go Back</button>
                <h2 className="title is-4">Pick a Backlog Item</h2>
                <p className="mb-3">You have <strong>{30 - myPlannedHours()}</strong> hours left to plan.</p>

                <div className="field is-grouped mb-3">
                    {['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D'].map(cat => (
                        <div className="control" key={cat}>
                            <button
                                className={`button is-small ${claimCatFilter[cat] ? 'cat-badge-' + cat : 'btn-secondary'}`}
                                onClick={() => setClaimCatFilter({ ...claimCatFilter, [cat]: !claimCatFilter[cat] })}
                            >
                                {catLabel(cat)} ({getCatBudget(cat) - getCatClaimed(cat)}h left)
                            </button>
                        </div>
                    ))}
                </div>

                {claimableEntries().map(e => (
                    <div className="box mb-2" key={e.id}>
                        <div className="columns is-vcentered is-multiline">
                            <div className="column">
                                <strong>{e.title}</strong>
                                <span className={`tag is-cat ml-1 cat-badge-${e.category}`}>{catLabel(e.category)}</span>
                                {e.estimatedEffort && <span className="text-secondary is-size-7 ml-1">{e.estimatedEffort}h est.</span>}
                                {e.status === 'IN_PLAN' && <span className="tag is-light ml-1">(Someone picked this)</span>}
                                <p className="text-secondary is-size-7 mt-1">
                                    {(e.description || '').substring(0, 100)}
                                    {e.description?.length > 100 ? '...' : ''}
                                </p>
                            </div>
                            <div className="column is-narrow">
                                <button className="button is-small btn-primary" onClick={() => startClaim(e)}>Pick This Item</button>
                            </div>
                        </div>
                    </div>
                ))}
                {claimableEntries().length === 0 && (
                    <div className="notification is-app-info">No backlog items are available in the categories you selected.</div>
                )}

                {/* CLAIM MODAL */}
                {claimModal && (
                    <div className="modal is-active">
                        <div className="modal-background" onClick={() => setClaimModal(false)}></div>
                        <div className="modal-card">
                            <header className="modal-card-head">
                                <p className="modal-card-title">How many hours will you work on this?</p>
                                <button className="delete" onClick={() => setClaimModal(false)}></button>
                            </header>
                            <section className="modal-card-body">
                                <p className="mb-2">
                                    <strong>{claimEntry?.title}</strong>
                                    <span className={`tag is-cat cat-badge-${claimEntry?.category}`}>
                                        {catLabel(claimEntry?.category)}
                                    </span>
                                </p>
                                <p className="mb-1">Your hours left: <strong>{30 - myPlannedHours()}</strong></p>
                                <p className="mb-3">{catLabel(claimEntry?.category)} budget left: {getCatBudget(claimEntry?.category) - getCatClaimed(claimEntry?.category)}h</p>
                                {claimEntry?.estimatedEffort && (
                                    <p className="mb-2 text-secondary">
                                        Estimate for this item: {claimEntry.estimatedEffort}h. You can enter any amount.
                                    </p>
                                )}
                                <div className="field">
                                    <label className="label">Hours to commit</label>
                                    <div className="control">
                                        <input
                                            className="input"
                                            type="number"
                                            value={claimHours}
                                            onChange={e => setClaimHours(e.target.value)}
                                            step="0.5"
                                            min="0.5"
                                            placeholder="Enter hours (like 2 or 3.5)"
                                        />
                                    </div>
                                </div>
                                {claimError && <p className="help has-text-danger">{claimError}</p>}
                            </section>
                            <footer className="modal-card-foot">
                                <button className="button btn-primary" onClick={submitClaim}>Add to My Plan</button>
                                <button className="button btn-secondary" onClick={() => setClaimModal(false)}>Cancel</button>
                            </footer>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // view === 'planning'
    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={goHome}>← Home</button>
            <h2 className="title is-4">Plan My Work</h2>

            <div className="notification is-app-info">
                Your hours: <strong>{myPlannedHours()}</strong> of 30 planned.{' '}
                <strong>{30 - myPlannedHours()}</strong> hours left.
                {myPlan()?.isReady && <span className="tag is-success ml-2">✓ You marked yourself as ready</span>}
            </div>

            {/* Category Budgets */}
            <div className="columns mb-4">
                {['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D'].map(cat => (
                    <div className="column" key={cat}>
                        <div className="box">
                            <span className={`tag is-cat mb-1 cat-badge-${cat}`}>{catLabel(cat)}</span>
                            <p className="is-size-7">Budget: <strong>{getCatBudget(cat)}h</strong></p>
                            <p className="is-size-7">Claimed: <strong>{getCatClaimed(cat)}h</strong></p>
                            <p className="is-size-7">Left: <strong>{getCatBudget(cat) - getCatClaimed(cat)}h</strong></p>
                            <div className="progress-bar-outer mt-1">
                                <div
                                    className="progress-bar-inner is-ok"
                                    style={{ width: `${Math.min(100, (getCatClaimed(cat) / Math.max(1, getCatBudget(cat))) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="button btn-primary mb-4"
                onClick={() => setView('claim')}
                disabled={myPlannedHours() >= 30}
            >
                Add Work from Backlog
            </button>

            <button
                className="button btn-secondary mb-4 ml-2"
                onClick={toggleReady}
            >
                {myPlan()?.isReady ? "Undo — I'm Not Done Yet" : "I'm Done Planning"}
            </button>

            {/* My Tasks */}
            <h3 className="title is-5">My Plan</h3>

            {myAssignments().length === 0 && (
                <div className="notification is-app-info">
                    You haven't picked any work yet. Click "Add Work from Backlog" to get started.
                </div>
            )}

            {myAssignments().map(ta => {
                const entry = getEntry(ta.backlogEntryId);
                return (
                    <div className="box mb-2" key={ta.id}>
                        <div className="columns is-vcentered is-mobile is-multiline">
                            <div className="column">
                                <strong>{entry?.title}</strong>
                                <span className={`tag is-cat ml-1 cat-badge-${entry?.category}`}>{catLabel(entry?.category)}</span>
                                <span className="ml-2">{ta.committedHours}h</span>
                            </div>
                            <div className="column is-narrow">
                                {editingAssignId !== ta.id ? (
                                    <span>
                                        <button className="button is-small btn-secondary mr-1" onClick={() => { setEditingAssignId(ta.id); setEditingAssignHrs(ta.committedHours); }}>
                                            Change Hours
                                        </button>
                                        <button className="button is-small btn-danger" onClick={() => removeAssignment(ta.id)}>
                                            Remove
                                        </button>
                                    </span>
                                ) : (
                                    <div className="field has-addons">
                                        <div className="control">
                                            <input
                                                className="input is-small"
                                                type="number"
                                                value={editingAssignHrs}
                                                onChange={e => setEditingAssignHrs(e.target.value)}
                                                step="0.5" min="0.5" max="30"
                                                style={{ width: '80px' }}
                                            />
                                        </div>
                                        <div className="control"><button className="button is-small btn-primary" onClick={() => saveAssignHours(ta.id)}>Save</button></div>
                                        <div className="control"><button className="button is-small btn-secondary" onClick={() => setEditingAssignId(null)}>Cancel</button></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {assignError && editingAssignId === ta.id && <p className="help has-text-danger">{assignError}</p>}
                    </div>
                );
            })}
        </div>
    );
}
