import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function FreezeReview() {
    const {
        goHome, activeCycle, getCatBudget, getCatClaimed, catLabel,
        getMember, getEntry, showConfirm, showError, showToast, save, setView,
        memberPlans, taskAssignments, setTaskAssignments, setMemberPlans,
        setCategoryAllocations, setPlanningCycles
    } = useAppContext();

    const [freezeDetailMember, setFreezeDetailMember] = React.useState(null);

    const cycle = activeCycle();

    const getMemberPlan = (mid) => {
        return cycle ? memberPlans.find(p => p.cycleId === cycle.id && p.memberId === mid) : null;
    };

    const getMemberAssignments = (mid) => {
        const p = getMemberPlan(mid);
        return p ? taskAssignments.filter(t => t.memberPlanId === p.id) : [];
    };

    const getMemberPlanned = (mid) => {
        return getMemberAssignments(mid).reduce((s, t) => s + t.committedHours, 0);
    };

    const freezeErrors = () => {
        if (!cycle) return [];
        const errs = [];
        for (const mid of cycle.participatingMemberIds) {
            const h = getMemberPlanned(mid);
            const n = getMember(mid)?.name;
            if (h !== 30) errs.push(`${n} has ${h} hours (needs ${h < 30 ? (30 - h) + ' more' : (h - 30) + ' fewer'}).`);
        }
        for (const cat of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']) {
            const budget = getCatBudget(cat);
            const claimed = getCatClaimed(cat);
            if (claimed !== budget) errs.push(`${catLabel(cat)} has ${claimed}h planned but budget is ${budget}h.`);
        }
        return errs;
    };

    const confirmFreeze = () => {
        showConfirm('Freeze the Plan?', 'After this, nobody can change their hours. Team members will only report progress.', () => {
            if (freezeErrors().length > 0) { showError('Validation failed.'); return; }
            const c = activeCycle();
            c.state = 'FROZEN';
            save();
            showToast('The plan is frozen! Team members can now report progress.');
            goHome();
        }, 'Yes, Freeze It');
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

    const errors = freezeErrors();

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={goHome}>← Home</button>
            <h2 className="title is-4">Review the Team's Plan</h2>
            <p className="text-secondary mb-4">
                Week of {cycle?.planningDate}. {cycle?.participatingMemberIds.length} team members. {cycle?.participatingMemberIds.length * 30} total hours.
            </p>

            {/* Category Summary */}
            <h3 className="title is-5">Category Summary</h3>
            <table className="table is-fullwidth is-hoverable mb-4">
                <thead>
                    <tr><th>Category</th><th>Budget</th><th>Planned</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D'].map(cat => (
                        <tr key={cat}>
                            <td><span className={`tag is-cat cat-badge-${cat}`}>{catLabel(cat)}</span></td>
                            <td>{getCatBudget(cat)}h</td>
                            <td>{getCatClaimed(cat)}h</td>
                            <td>
                                <span className={getCatClaimed(cat) === getCatBudget(cat) ? 'has-text-success' : 'has-text-danger'}>
                                    {getCatClaimed(cat) === getCatBudget(cat) ? '✓ Match' : `⚠ Off by ${Math.abs(getCatBudget(cat) - getCatClaimed(cat))}h`}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Member Summary */}
            <h3 className="title is-5">Member Summary</h3>
            {(cycle?.participatingMemberIds || []).map(mid => (
                <div className="box mb-2" onClick={() => setFreezeDetailMember(freezeDetailMember === mid ? null : mid)} style={{ cursor: 'pointer' }} key={mid}>
                    <div className="columns is-vcentered is-mobile">
                        <div className="column"><strong>{getMember(mid)?.name}</strong></div>
                        <div className="column">
                            <span className={getMemberPlanned(mid) === 30 ? 'has-text-success' : 'has-text-danger'}>
                                {getMemberPlanned(mid)} / 30h
                            </span>
                        </div>
                        <div className="column is-narrow">
                            <span className={`tag ${getMemberPlan(mid)?.isReady ? 'is-success' : 'is-light'}`}>
                                {getMemberPlan(mid)?.isReady ? '✓ Ready' : 'Not yet'}
                            </span>
                        </div>
                    </div>

                    {freezeDetailMember === mid && (
                        <div className="mt-2">
                            <table className="table is-fullwidth is-size-7">
                                <thead><tr><th>Item</th><th>Category</th><th>Hours</th></tr></thead>
                                <tbody>
                                    {getMemberAssignments(mid).map(ta => {
                                        const entry = getEntry(ta.backlogEntryId);
                                        return (
                                            <tr key={ta.id}>
                                                <td>{entry?.title}</td>
                                                <td><span className={`tag is-cat is-small cat-badge-${entry?.category}`}>{catLabel(entry?.category)}</span></td>
                                                <td>{ta.committedHours}h</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}

            {/* Validation */}
            {errors.length === 0 && (
                <div className="notification is-app-success mt-4">Everything looks good! You can freeze the plan.</div>
            )}

            {errors.length > 0 && (
                <div className="notification is-app-danger mt-4">
                    <p className="has-text-weight-bold mb-1">Can't freeze yet:</p>
                    {errors.map((err, i) => <p key={i}>• {err}</p>)}
                </div>
            )}

            <div className="mt-4">
                <button
                    className="button btn-primary is-medium"
                    disabled={errors.length > 0}
                    onClick={confirmFreeze}
                >
                    ❄️ Freeze the Plan
                </button>
                <button
                    className="button btn-danger is-small ml-3"
                    onClick={confirmCancelPlanning}
                >
                    Cancel Planning
                </button>
            </div>
        </div>
    );
}
