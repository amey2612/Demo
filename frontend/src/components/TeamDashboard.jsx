import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function TeamDashboard() {
    const {
        view, setView, goHome, activeCycle, planningCycles, dashCycleId,
        memberPlans, taskAssignments, getEntry, catLabel, getMember,
        statusLabel, isLead
    } = useAppContext();

    const dashCycle = () => planningCycles.find(c => c.id === dashCycleId);

    const dashAllAssignments = () => {
        const c = dashCycle();
        if (!c) return [];
        const pids = memberPlans.filter(p => p.cycleId === c.id).map(p => p.id);
        return taskAssignments.filter(t => pids.includes(t.memberPlanId));
    };

    const dashCapacity = () => dashCycle()?.teamCapacity || 0;
    const dashTotalCompleted = () => dashAllAssignments().reduce((s, t) => s + t.hoursCompleted, 0);
    const dashCompletedTasks = () => dashAllAssignments().filter(t => t.progressStatus === 'COMPLETED').length;
    const dashBlockedTasks = () => dashAllAssignments().filter(t => t.progressStatus === 'BLOCKED').length;

    const getDashCatBudget = (cat) => {
        const c = dashCycle();
        if (!c) return 0;
        // We would need categoryAllocations from context here if we want exact budget.
        // Assuming context has this if needed, but for now we can read from context or pass it.
    };

    // Require categoryAllocations from context for exact budgets
    const { categoryAllocations } = useAppContext();
    const getBudget = (cat) => {
        const c = dashCycle();
        if (!c) return 0;
        const a = categoryAllocations.find(x => x.cycleId === c.id && x.category === cat);
        return a ? a.budgetHours : 0;
    };

    const dashCatCompleted = (cat) => {
        return dashAllAssignments()
            .filter(t => getEntry(t.backlogEntryId)?.category === cat)
            .reduce((s, t) => s + t.hoursCompleted, 0);
    };

    const dashMemberCompleted = (mid) => {
        const c = dashCycle();
        const p = memberPlans.find(pp => pp.cycleId === c?.id && pp.memberId === mid);
        return p ? taskAssignments.filter(t => t.memberPlanId === p.id).reduce((s, t) => s + t.hoursCompleted, 0) : 0;
    };

    const dashMemberAssignments = (mid) => {
        const c = dashCycle();
        const p = memberPlans.find(pp => pp.cycleId === c?.id && pp.memberId === mid);
        return p ? taskAssignments.filter(t => t.memberPlanId === p.id) : [];
    };

    const dashMemberBlocked = (mid) => dashMemberAssignments(mid).some(t => t.progressStatus === 'BLOCKED');
    const dashMemberAllDone = (mid) => {
        const a = dashMemberAssignments(mid);
        return a.length > 0 && a.every(t => t.progressStatus === 'COMPLETED');
    };

    const handleBack = () => {
        if (dashCycleId === activeCycle()?.id) {
            goHome();
        } else {
            setView('pastCycles');
        }
    };

    const setDrill = (type, val) => {
        // Requires expanding context to hold drill variables (drillCat, drillMember, prevDrillView)
        // For simplicity, we can pass these to app context or structure them as routes.
        // Assuming we added them to context or local storage.
    };

    const cycle = dashCycle();
    if (!cycle) return <div className="notification is-app-danger">Cycle not found.</div>;

    const allAssigned = dashAllAssignments();

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={handleBack}>
                ← {dashCycleId === activeCycle()?.id ? 'Home' : 'Back'}
            </button>

            <h2 className="title is-4">
                {`${cycle.state === 'COMPLETED' ? 'Past Week — ' : 'Team Progress — '}${cycle.planningDate}`}
            </h2>

            <span className={`tag mb-4 ${cycle.state === 'FROZEN' ? 'is-info' : 'is-success'}`}>
                {cycle.state}
            </span>

            {/* Summary Cards */}
            <div className="columns mb-4">
                <div className="column">
                    <div className="box has-text-centered">
                        <p className="is-size-7 text-secondary">Overall Progress</p>
                        <p className="is-size-4 has-text-weight-bold">{dashTotalCompleted()}h / {dashCapacity()}h</p>
                        <p>{Math.round(dashTotalCompleted() / Math.max(1, dashCapacity()) * 100)}%</p>
                        <div className="progress-bar-outer mt-1">
                            <div
                                className="progress-bar-inner is-ok"
                                style={{ width: `${Math.min(100, dashTotalCompleted() / Math.max(1, dashCapacity()) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="column">
                    <div className="box has-text-centered">
                        <p className="is-size-7 text-secondary">Tasks Done</p>
                        <p className="is-size-4 has-text-weight-bold">{dashCompletedTasks()} / {allAssigned.length}</p>
                    </div>
                </div>

                <div className="column">
                    <div className="box has-text-centered" style={dashBlockedTasks() > 0 ? { borderColor: 'var(--danger)' } : {}}>
                        <p className="is-size-7 text-secondary">Blocked</p>
                        <p className="is-size-4 has-text-weight-bold" style={dashBlockedTasks() > 0 ? { color: 'var(--danger)' } : {}}>
                            {dashBlockedTasks()}
                        </p>
                    </div>
                </div>
            </div>

            {allAssigned.length > 0 && allAssigned.every(t => t.progressStatus === 'COMPLETED') && (
                <div className="notification is-app-success mb-4">🎉 Great work! All tasks are done this week!</div>
            )}

            {allAssigned.length > 0 && allAssigned.every(t => t.hoursCompleted === 0) && cycle.state === 'FROZEN' && (
                <div className="notification is-app-info mb-4">No one has reported progress yet.</div>
            )}

            {/* Category Breakdown */}
            <h3 className="title is-5">By Category</h3>
            {['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D'].map(cat => {
                const bdg = getBudget(cat);
                const cmp = dashCatCompleted(cat);
                const pct = Math.round(cmp / Math.max(1, bdg) * 100);

                return (
                    <div className="box mb-3" key={cat} onClick={() => {
                        // we dispatch to view here by modifying state on main route
                        window.sessionStorage.setItem('drillCat', cat);
                        setView('catDrill');
                    }} style={{ cursor: 'pointer' }}>
                        <div className="columns is-vcentered">
                            <div className="column"><span className={`tag is-cat cat-badge-${cat}`}>{catLabel(cat)}</span></div>
                            <div className="column"><span>Budget: {bdg}h</span></div>
                            <div className="column"><span>Done: {cmp}h ({pct}%)</span></div>
                            <div className="column is-narrow"><button className="button is-small btn-secondary">See Details →</button></div>
                        </div>
                        <div className="progress-bar-outer mt-1">
                            <div className="progress-bar-inner is-ok" style={{ width: `${Math.min(100, pct)}%` }}></div>
                        </div>
                    </div>
                );
            })}

            {/* Member Breakdown */}
            {isLead() && (
                <div className="mt-5">
                    <h3 className="title is-5">By Member</h3>
                    {(cycle.participatingMemberIds || []).map(mid => {
                        const cmp = dashMemberCompleted(mid);
                        const pct = Math.round(cmp / 30 * 100);
                        const blocked = dashMemberBlocked(mid);
                        const allDone = dashMemberAllDone(mid);

                        return (
                            <div className="box mb-2" key={mid} onClick={() => {
                                window.sessionStorage.setItem('drillMember', mid);
                                setView('memberDrill');
                            }} style={{ cursor: 'pointer' }}>
                                <div className="columns is-vcentered is-mobile">
                                    <div className="column"><strong>{getMember(mid)?.name}</strong></div>
                                    <div className="column"><span>{cmp}h / 30h ({pct}%)</span></div>
                                    <div className="column is-narrow">
                                        <span className={`tag ${blocked ? 'is-danger' : allDone ? 'is-success' : 'is-info'}`}>
                                            {blocked ? 'Blocked' : allDone ? 'All Done' : 'Working'}
                                        </span>
                                        <button className="button is-small btn-secondary ml-2">See Plan →</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLead() && (
                <div className="notification is-app-info mt-4">
                    Team completion: <strong>{Math.round(dashTotalCompleted() / Math.max(1, dashCapacity()) * 100)}%</strong>
                </div>
            )}
        </div>
    );
}
