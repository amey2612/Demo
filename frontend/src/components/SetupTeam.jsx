import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function SetupTeam() {
    const { setAppSettings, setTeamMembers, teamMembers, uid, setCurrentUserId, setView, save } = useAppContext();
    const [setupMembers, setSetupMembers] = useState([]);
    const [setupName, setSetupName] = useState('');
    const [setupError, setSetupError] = useState('');

    const addSetupMember = () => {
        setSetupError('');
        const n = setupName.trim();
        if (!n) { setSetupError('Please type a name.'); return; }
        if (setupMembers.some(m => m.name.toLowerCase() === n.toLowerCase())) {
            setSetupError('This name is already used.');
            return;
        }
        setSetupMembers([...setupMembers, {
            id: uid(), name: n, isLead: setupMembers.length === 0, isActive: true, createdAt: new Date().toISOString()
        }]);
        setSetupName('');
    };

    const finishSetup = () => {
        if (setupMembers.length === 0) { setSetupError('Please add at least one team member.'); return; }
        if (!setupMembers.some(m => m.isLead)) { setSetupError('Please pick one person as the Team Lead.'); return; }

        setTeamMembers(setupMembers);
        setAppSettings(prev => ({ ...prev, setupComplete: true }));

        if (setupMembers.length === 1) {
            setCurrentUserId(setupMembers[0].id);
            setView('hub');
        } else {
            setView('identity');
        }
    };

    const makeLead = (index) => {
        const updated = setupMembers.map((m, j) => ({ ...m, isLead: index === j }));
        setSetupMembers(updated);
    };

    const removeMember = (index) => {
        setSetupMembers(setupMembers.filter((_, i) => i !== index));
    };

    return (
        <div>
            <h1 className="title is-3">👋 Welcome! Let's set up your team.</h1>
            <p className="subtitle is-6">Add the people on your team. Pick one person as the Team Lead.</p>

            <div className="box mb-4">
                <div className="field has-addons">
                    <div className="control is-expanded">
                        <input
                            className="input"
                            type="text"
                            value={setupName}
                            onChange={e => setSetupName(e.target.value)}
                            placeholder="Type a name here"
                            onKeyDown={e => e.key === 'Enter' && addSetupMember()}
                            maxLength="100"
                        />
                    </div>
                    <div className="control">
                        <button className="button btn-primary" onClick={addSetupMember}>Add This Person</button>
                    </div>
                </div>
                {setupError && <p className="help has-text-danger">{setupError}</p>}
            </div>

            {setupMembers.length === 0 && (
                <div className="box">
                    <p className="text-secondary">No team members added yet.</p>
                </div>
            )}

            {setupMembers.map((m, i) => (
                <div className="box mb-2" key={i}>
                    <div className="columns is-vcentered is-mobile">
                        <div className="column">
                            <strong>{m.name}</strong>
                            {m.isLead && <span className="tag is-warning is-light ml-2">Team Lead</span>}
                        </div>
                        <div className="column is-narrow">
                            {!m.isLead && (
                                <button className="button is-small btn-secondary mr-1" onClick={() => makeLead(i)}>
                                    Make Lead
                                </button>
                            )}
                            <button className="button is-small btn-danger" onClick={() => removeMember(i)}>Remove</button>
                        </div>
                    </div>
                </div>
            ))}

            <button
                className="button btn-primary is-medium mt-4"
                disabled={setupMembers.length === 0 || !setupMembers.some(m => m.isLead)}
                onClick={finishSetup}
            >
                Done — Go to Home Screen
            </button>
        </div>
    );
}
