import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function PastCycles() {
    const { planningCycles, goHome, setDashCycleId, setView } = useAppContext();

    const pastCyclesList = planningCycles
        .filter(c => c.state === 'COMPLETED' || c.state === 'FROZEN')
        .sort((a, b) => b.planningDate.localeCompare(a.planningDate));

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={goHome}>← Home</button>
            <h2 className="title is-4">Past Weeks</h2>

            {pastCyclesList.length === 0 && (
                <div className="notification is-app-info">No past weeks yet.</div>
            )}

            {pastCyclesList.map(c => (
                <div
                    className="box mb-2 action-card"
                    key={c.id}
                    onClick={() => {
                        setDashCycleId(c.id);
                        setView('dashboard');
                    }}
                >
                    <div className="columns is-vcentered is-mobile">
                        <div className="column">
                            <strong>Week of {c.planningDate}</strong>
                            <span className={`tag ml-2 ${c.state === 'COMPLETED' ? 'is-success' : 'is-info'}`}>
                                {c.state}
                            </span>
                        </div>
                        <div className="column is-narrow">
                            <span className="text-secondary">{c.participatingMemberIds.length} members</span>
                            <button className="button is-small btn-secondary ml-2">View Details →</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
