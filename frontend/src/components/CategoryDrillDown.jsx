import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function CategoryDrillDown() {
    const { setView, dashCycleId, planningCycles, memberPlans, taskAssignments, getEntry, isLead, getMember, statusLabel, catLabel, categoryAllocations } = useAppContext();
    const drillCat = window.sessionStorage.getItem('drillCat');

    const dashCycle = () => planningCycles.find(c => c.id === dashCycleId);

    const dashAllAssignments = () => {
        const c = dashCycle();
        if (!c) return [];
        const pids = memberPlans.filter(p => p.cycleId === c.id).map(p => p.id);
        return taskAssignments.filter(t => pids.includes(t.memberPlanId));
    };

    const getAssignMember = (ta) => {
        if (!ta) return null;
        const p = memberPlans.find(pp => pp.id === ta.memberPlanId);
        return p?.memberId;
    };

    const dashCatAssignments = (cat) => {
        return dashAllAssignments().filter(t => getEntry(t.backlogEntryId)?.category === cat);
    };

    const dashCatCompleted = (cat) => dashCatAssignments(cat).reduce((s, t) => s + t.hoursCompleted, 0);

    const getDashCatBudget = (cat) => {
        const c = dashCycle();
        if (!c) return 0;
        const a = categoryAllocations.find(x => x.cycleId === c.id && x.category === cat);
        return a ? a.budgetHours : 0;
    };

    const bdg = getDashCatBudget(drillCat);
    const cmp = dashCatCompleted(drillCat);
    const pct = Math.round(cmp / Math.max(1, bdg) * 100);

    const viewTask = (ta) => {
        window.sessionStorage.setItem('drillTask', ta.id);
        window.sessionStorage.setItem('prevDrillView', 'catDrill');
        setView('taskDrill');
    };

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={() => setView('dashboard')}>← Go Back</button>
            <h2 className="title is-4">
                <span className={`tag is-cat cat-badge-${drillCat}`}>{catLabel(drillCat)}</span> — Details
            </h2>
            <p className="mb-3">Budget: {bdg}h. Completed: {cmp}h ({pct}%)</p>

            <table className="table is-fullwidth is-hoverable">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>{isLead() ? 'Assigned To' : 'Member'}</th>
                        <th>Committed</th>
                        <th>Done</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {dashCatAssignments(drillCat).map(ta => (
                        <tr key={ta.id} onClick={() => viewTask(ta)} style={{ cursor: 'pointer' }}>
                            <td>{getEntry(ta.backlogEntryId)?.title}</td>
                            <td>{isLead() ? getMember(getAssignMember(ta))?.name : 'Team Member'}</td>
                            <td>{ta.committedHours}h</td>
                            <td>{ta.hoursCompleted}h</td>
                            <td><span className={`tag stat-badge-${ta.progressStatus}`}>{statusLabel(ta.progressStatus)}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
