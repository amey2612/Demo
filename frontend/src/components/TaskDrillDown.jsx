import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function TaskDrillDown() {
    const { setView, dashCycleId, planningCycles, memberPlans, taskAssignments, getEntry, catLabel, statusLabel, getMember, progressUpdates } = useAppContext();

    const drillTaskId = window.sessionStorage.getItem('drillTask');
    const prevDrillView = window.sessionStorage.getItem('prevDrillView') || 'dashboard';

    const dashCycle = () => planningCycles.find(c => c.id === dashCycleId);
    const dashAllAssignments = () => {
        const c = dashCycle();
        if (!c) return [];
        const pids = memberPlans.filter(p => p.cycleId === c.id).map(p => p.id);
        return taskAssignments.filter(t => pids.includes(t.memberPlanId));
    };

    const getAssignMember = (t) => {
        if (!t) return null;
        const p = memberPlans.find(pp => pp.id === t.memberPlanId);
        return p?.memberId;
    };

    const drillTask = dashAllAssignments().find(t => t.id === drillTaskId);
    const entry = getEntry(drillTask?.backlogEntryId);

    const allEntryAssignments = (eid) => dashAllAssignments().filter(t => t.backlogEntryId === eid);
    const taskProgressHistory = (taId) => progressUpdates.filter(p => p.taskAssignmentId === taId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    if (!drillTask) return <div className="notification">Task not found.</div>;

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={() => setView(prevDrillView)}>← Go Back</button>
            <h2 className="title is-4">{entry?.title}</h2>

            <div className="box mb-4">
                <p><strong>Category:</strong> <span className={`tag is-cat cat-badge-${entry?.category}`}>{catLabel(entry?.category)}</span></p>
                {entry?.description && <p><strong>Description:</strong> <span>{entry?.description}</span></p>}
                {entry?.estimatedEffort && <p><strong>Estimate:</strong> <span>{entry?.estimatedEffort}h</span></p>}
                <p><strong>Assigned to:</strong> <span>{getMember(getAssignMember(drillTask))?.name}</span></p>
                <p><strong>Committed:</strong> <span>{drillTask.committedHours}h</span></p>
                <p><strong>Done:</strong> <span>{drillTask.hoursCompleted}h</span></p>
                <p><strong>Status:</strong> <span className={`tag stat-badge-${drillTask.progressStatus}`}>{statusLabel(drillTask.progressStatus)}</span></p>
            </div>

            {/* All assignments for this entry in this cycle */}
            {allEntryAssignments(drillTask.backlogEntryId).length > 1 && (
                <div className="box mb-4">
                    <h4 className="title is-6">All members assigned to this item</h4>
                    <table className="table is-fullwidth is-size-7">
                        <thead>
                            <tr><th>Member</th><th>Committed</th><th>Done</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {allEntryAssignments(drillTask.backlogEntryId).map(ta2 => (
                                <tr key={ta2.id}>
                                    <td>{getMember(getAssignMember(ta2))?.name}</td>
                                    <td>{ta2.committedHours}h</td>
                                    <td>{ta2.hoursCompleted}h</td>
                                    <td><span className={`tag stat-badge-${ta2.progressStatus}`}>{statusLabel(ta2.progressStatus)}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Progress History */}
            <h4 className="title is-6">Update History</h4>
            {taskProgressHistory(drillTask.id).length === 0 && (
                <div className="notification is-app-info">No progress updates yet.</div>
            )}
            {taskProgressHistory(drillTask.id).map(pu => (
                <div className="box mb-2 is-size-7" key={pu.id}>
                    <p><strong>{new Date(pu.timestamp).toLocaleString()}</strong> — <span>{getMember(pu.updatedBy)?.name || 'Unknown'}</span></p>
                    <p>
                        Hours: {pu.previousHoursCompleted} → {pu.newHoursCompleted} | Status: {statusLabel(pu.previousStatus)} → {statusLabel(pu.newStatus)}
                    </p>
                    {pu.note && <p className="text-secondary">Note: {pu.note}</p>}
                </div>
            ))}
        </div>
    );
}
