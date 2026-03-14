import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function ActionHub() {
    const {
        currentUserName, isLead, activeCycle, setView, setDashCycleId, planningCycles,
        isParticipating, showConfirm, memberPlans, taskAssignments, setTaskAssignments,
        setMemberPlans, setCategoryAllocations, setPlanningCycles, save, showToast, getEntry
    } = useAppContext();

    const cycle = activeCycle();

    const startNewWeek = () => {
        if (cycle) {
            alert('There is already a week being planned.');
            return;
        }
        setView('cycleSetup');
    };

    const confirmCancelPlanning = () => {
        showConfirm('Cancel Planning?', "This will erase everyone's plans. This cannot be undone.", () => {
            const c = cycle;
            const pids = memberPlans.filter(p => p.cycleId === c.id).map(p => p.id);
            const affectedEntryIds = [...new Set(taskAssignments.filter(t => pids.includes(t.memberPlanId)).map(t => t.backlogEntryId))];

            setTaskAssignments(prev => prev.filter(t => !pids.includes(t.memberPlanId)));
            setMemberPlans(prev => prev.filter(p => p.cycleId !== c.id));
            setCategoryAllocations(prev => prev.filter(a => a.cycleId !== c.id));

            for (const eid of affectedEntryIds) {
                const e = getEntry(eid);
                if (e && e.status === 'IN_PLAN') {
                    const anyRef = taskAssignments.some(t => t.backlogEntryId === eid);
                    if (!anyRef) e.status = 'AVAILABLE';
                }
            }

            setPlanningCycles(prev => prev.filter(x => x.id !== c.id));
            save();
            showToast('Planning has been canceled.');
            setView('hub');
        }, 'Yes, Cancel Planning', true);
    };

    const confirmFinishWeek = () => {
        if (!cycle || cycle.state !== 'FROZEN') return;
        const pids = memberPlans.filter(p => p.cycleId === cycle.id).map(p => p.id);
        const allDone = taskAssignments.filter(t => pids.includes(t.memberPlanId)).every(t => t.progressStatus === 'COMPLETED');
        const msg = allDone
            ? 'All tasks are completed! Close out this week?'
            : 'Some tasks are not finished yet. Those backlog items will go back to the backlog. Are you sure?';

        showConfirm('Finish This Week?', msg, () => {
            cycle.state = 'COMPLETED';
            const entryIds = [...new Set(taskAssignments.filter(t => pids.includes(t.memberPlanId)).map(t => t.backlogEntryId))];
            for (const eid of entryIds) {
                const tas = taskAssignments.filter(t => pids.includes(t.memberPlanId) && t.backlogEntryId === eid);
                const e = getEntry(eid);
                if (!e) continue;
                if (tas.every(t => t.progressStatus === 'COMPLETED')) e.status = 'COMPLETED';
                else e.status = 'AVAILABLE';
            }
            save();
            showToast('This week is done! You can start planning a new week.');
            setView('hub');
        }, 'Yes, Finish This Week');
    };

    const viewDashboard = () => {
        setDashCycleId(cycle?.id || null);
        setView('dashboard');
    };

    return (
        <div>
            <h1 className="title is-3">What do you want to do?</h1>
            <p className="subtitle is-5">
                Hi, <span>{currentUserName()}</span>!{' '}
                <span className={`tag ${isLead() ? 'is-warning' : 'is-info'}`}>
                    {isLead() ? 'Team Lead' : 'Team Member'}
                </span>
            </p>

            {!cycle && isLead() && (
                <div className="notification is-app-info mb-4">
                    No planning weeks yet. Click "Start a New Week" to begin!
                </div>
            )}

            <div className="columns is-multiline">
                {/* LEAD: NO ACTIVE CYCLE */}
                {isLead() && !cycle && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={startNewWeek}>
                            <p className="is-size-5 has-text-weight-bold">🚀 Start a New Week</p>
                            <p className="text-secondary">Set up a new planning cycle.</p>
                        </div>
                    </div>
                )}

                {/* LEAD: SETUP */}
                {isLead() && cycle?.state === 'SETUP' && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={() => setView('cycleSetup')}>
                            <p className="is-size-5 has-text-weight-bold">⚙️ Set Up This Week's Plan</p>
                            <p className="text-secondary">Pick members and set category percentages.</p>
                        </div>
                    </div>
                )}

                {/* LEAD: PLANNING */}
                {isLead() && cycle?.state === 'PLANNING' && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={() => setView('freezeReview')}>
                            <p className="is-size-5 has-text-weight-bold">❄️ Review and Freeze the Plan</p>
                            <p className="text-secondary">Check everyone's hours and lock the plan.</p>
                        </div>
                    </div>
                )}

                {isLead() && cycle?.state === 'PLANNING' && isParticipating() && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={() => setView('planning')}>
                            <p className="is-size-5 has-text-weight-bold">📝 Plan My Work</p>
                            <p className="text-secondary">Pick backlog items and commit hours.</p>
                        </div>
                    </div>
                )}

                {/* LEAD: FROZEN */}
                {isLead() && cycle?.state === 'FROZEN' && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={viewDashboard}>
                            <p className="is-size-5 has-text-weight-bold">📊 See Team Progress</p>
                            <p className="text-secondary">Check how the team is doing.</p>
                        </div>
                    </div>
                )}

                {isLead() && cycle?.state === 'FROZEN' && isParticipating() && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={() => setView('progress')}>
                            <p className="is-size-5 has-text-weight-bold">✏️ Update My Progress</p>
                            <p className="text-secondary">Report hours and status on your tasks.</p>
                        </div>
                    </div>
                )}

                {isLead() && cycle?.state === 'FROZEN' && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={confirmFinishWeek}>
                            <p className="is-size-5 has-text-weight-bold">✅ Finish This Week</p>
                            <p className="text-secondary">Close out this cycle.</p>
                        </div>
                    </div>
                )}

                {/* MEMBER: PLANNING */}
                {!isLead() && cycle?.state === 'PLANNING' && isParticipating() && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={() => setView('planning')}>
                            <p className="is-size-5 has-text-weight-bold">📝 Plan My Work</p>
                            <p className="text-secondary">Pick backlog items and commit your 30 hours.</p>
                        </div>
                    </div>
                )}

                {/* MEMBER: FROZEN */}
                {!isLead() && cycle?.state === 'FROZEN' && isParticipating() && (
                    <>
                        <div className="column is-6">
                            <div className="box action-card" onClick={() => setView('progress')}>
                                <p className="is-size-5 has-text-weight-bold">✏️ Update My Progress</p>
                                <p className="text-secondary">Report hours and status on your tasks.</p>
                            </div>
                        </div>
                        <div className="column is-6">
                            <div className="box action-card" onClick={viewDashboard}>
                                <p className="is-size-5 has-text-weight-bold">📊 See Team Progress</p>
                                <p className="text-secondary">See how the team is doing overall.</p>
                            </div>
                        </div>
                    </>
                )}

                {/* No active cycle for member */}
                {!isLead() && (!cycle || !isParticipating()) && (
                    <div className="column is-12">
                        <div className="notification is-app-info">
                            There's no active plan for you right now. Check back on Tuesday or ask your Team Lead.
                        </div>
                    </div>
                )}

                {/* COMMON */}
                <div className="column is-6">
                    <div className="box action-card" onClick={() => setView('backlog')}>
                        <p className="is-size-5 has-text-weight-bold">📋 Manage Backlog</p>
                        <p className="text-secondary">Add, edit, or browse work items.</p>
                    </div>
                </div>

                {isLead() && (
                    <div className="column is-6">
                        <div className="box action-card" onClick={() => setView('team')}>
                            <p className="is-size-5 has-text-weight-bold">👥 Manage Team Members</p>
                            <p className="text-secondary">Add or remove team members.</p>
                        </div>
                    </div>
                )}

                <div className="column is-6">
                    <div className="box action-card" onClick={() => setView('pastCycles')}>
                        <p className="is-size-5 has-text-weight-bold">📅 View Past Weeks</p>
                        <p className="text-secondary">Look at completed planning cycles.</p>
                    </div>
                </div>

                {/* CANCEL PLANNING */}
                {isLead() && cycle?.state === 'PLANNING' && (
                    <div className="column is-6">
                        <div className="box action-card" style={{ borderColor: 'var(--danger)' }} onClick={confirmCancelPlanning}>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'var(--danger)' }}>
                                🗑️ Cancel This Week's Planning
                            </p>
                            <p className="text-secondary">Erase all plans and start over.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
