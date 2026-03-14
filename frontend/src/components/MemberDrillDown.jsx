import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function MemberDrillDown() {
    const { setView, dashCycleId, planningCycles, memberPlans, taskAssignments, getEntry, catLabel, statusLabel, getMember } = useAppContext();

    const drillMember = window.sessionStorage.getItem('drillMember');
    const dashCycle = () => planningCycles.find(c => c.id === dashCycleId);

    const dashMemberAssignments = (mid) => {
        const c = dashCycle();
        const p = memberPlans.find(pp => pp.cycleId === c?.id && pp.memberId === mid);
        return p ? taskAssignments.filter(t => t.memberPlanId === p.id) : [];
    };

    const dashMemberCompleted = (mid) => dashMemberAssignments(mid).reduce((s, t) => s + t.hoursCompleted, 0);

    const cmp = dashMemberCompleted(drillMember);
    const pct = Math.round(cmp / 30 * 100);

    const viewTask = (ta) => {
        window.sessionStorage.setItem('drillTask', ta.id);
        window.sessionStorage.setItem('prevDrillView', 'memberDrill');
        setView('taskDrill');
    };

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={() => setView('dashboard')}>← Go Back</button>
            <h2 className="title is-4">{getMember(drillMember)?.name}'s Plan</h2>
            <p className="mb-3">Hours completed: {cmp} of 30 ({pct}%)</p>

            <div className="progress-bar-outer mb-4">
                <div className="progress-bar-inner is-ok" style={{ width: `${Math.min(100, pct)}%` }}></div>
            </div>

            <table className="table is-fullwidth is-hoverable">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Committed</th>
                        <th>Done</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {dashMemberAssignments(drillMember).map(ta => (
                        <tr key={ta.id} onClick={() => viewTask(ta)} style={{ cursor: 'pointer' }} className={ta.hoursCompleted > ta.committedHours ? 'overage' : ''}>
                            <td>{getEntry(ta.backlogEntryId)?.title}</td>
                            <td><span className={`tag is-cat cat-badge-${getEntry(ta.backlogEntryId)?.category}`}>{catLabel(getEntry(ta.backlogEntryId)?.category)}</span></td>
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
