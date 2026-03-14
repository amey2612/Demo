import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function IdentitySelection() {
    const { activeMembers, selectIdentity } = useAppContext();

    return (
        <div>
            <h1 className="title is-3">Who are you?</h1>
            <p className="subtitle is-6">Click your name to get started.</p>

            <div className="columns is-multiline">
                {activeMembers().map(m => (
                    <div className="column is-6-tablet is-4-desktop" key={m.id}>
                        <div className="member-card" onClick={() => selectIdentity(m.id)}>
                            <p className="is-size-5 has-text-weight-semibold">{m.name}</p>
                            <span className={`tag mt-2 ${m.isLead ? 'is-warning' : 'is-info'}`}>
                                {m.isLead ? 'Team Lead' : 'Team Member'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
