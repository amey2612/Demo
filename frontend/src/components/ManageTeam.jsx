import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function ManageTeam() {
    const { teamMembers, setTeamMembers, goHome, uid, save, showToast, showError, activeCycle, showConfirm } = useAppContext();

    const [newMemberName, setNewMemberName] = useState('');
    const [teamError, setTeamError] = useState('');
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editingMemberVal, setEditingMemberVal] = useState('');

    const addTeamMember = () => {
        setTeamError('');
        const n = newMemberName.trim();
        if (!n) { setTeamError('Please type a name.'); return; }
        if (n.length > 100) { setTeamError('Name is too long. Please use 100 letters or fewer.'); return; }
        if (teamMembers.some(m => m.name.toLowerCase() === n.toLowerCase())) { setTeamError('This name is already used.'); return; }

        setTeamMembers([...teamMembers, {
            id: uid(), name: n, isLead: false, isActive: true, createdAt: new Date().toISOString()
        }]);
        setNewMemberName('');
        save();
        showToast('Team member added!');
    };

    const saveEditMember = (id) => {
        const n = editingMemberVal.trim();
        if (!n) { setTeamError('Please type a name.'); return; }
        if (teamMembers.some(m => m.id !== id && m.name.toLowerCase() === n.toLowerCase())) {
            showError('This name is already used.');
            return;
        }
        setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, name: n } : m));
        setEditingMemberId(null);
        save();
        showToast('Name updated!');
    };

    const makeLead = (id) => {
        setTeamMembers(teamMembers.map(m => ({ ...m, isLead: m.id === id })));
        save();
        showToast('Team Lead changed!');
    };

    const deactivateMember = (id) => {
        const ac = activeCycle();
        if (ac && ac.participatingMemberIds.includes(id)) {
            showError('This person is part of an active plan right now.');
            return;
        }
        const member = teamMembers.find(m => m.id === id);
        showConfirm(
            `Remove ${member?.name}?`,
            "They won't be available for future plans. Their past work will still be saved.",
            () => {
                setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, isActive: false } : m));
                save();
                showToast('Member deactivated.');
            },
            'Yes, Remove Them',
            true
        );
    };

    const reactivateMember = (id) => {
        setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, isActive: true } : m));
        save();
        showToast('Member reactivated!');
    };

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={goHome}>← Home</button>
            <h2 className="title is-4">Manage Team Members</h2>

            <div className="box mb-4">
                <div className="field has-addons">
                    <div className="control is-expanded">
                        <input
                            className="input"
                            type="text"
                            value={newMemberName}
                            onChange={e => setNewMemberName(e.target.value)}
                            placeholder="Type a name"
                            maxLength="100"
                            onKeyDown={e => e.key === 'Enter' && addTeamMember()}
                        />
                    </div>
                    <div className="control">
                        <button className="button btn-primary" onClick={addTeamMember}>Save This Person</button>
                    </div>
                </div>
                {teamError && <p className="help has-text-danger">{teamError}</p>}
            </div>

            {teamMembers.map(m => (
                <div className="box mb-2" style={{ opacity: !m.isActive ? 0.6 : 1 }} key={m.id}>
                    <div className="columns is-vcentered is-mobile is-multiline">
                        <div className="column">
                            {editingMemberId !== m.id ? (
                                <span>
                                    <strong>{m.name}</strong>
                                    {m.isLead && <span className="tag is-warning is-light ml-1">Lead</span>}
                                    {!m.isActive && <span className="tag is-light ml-1">Inactive</span>}
                                </span>
                            ) : (
                                <div className="field has-addons">
                                    <div className="control">
                                        <input
                                            className="input is-small"
                                            value={editingMemberVal}
                                            onChange={e => setEditingMemberVal(e.target.value)}
                                            maxLength="100"
                                            onKeyDown={e => e.key === 'Enter' && saveEditMember(m.id)}
                                        />
                                    </div>
                                    <div className="control">
                                        <button className="button is-small btn-primary" onClick={() => saveEditMember(m.id)}>Save</button>
                                    </div>
                                    <div className="control">
                                        <button className="button is-small btn-secondary" onClick={() => setEditingMemberId(null)}>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {editingMemberId !== m.id && (
                            <div className="column is-narrow">
                                {m.isActive && (
                                    <button className="button is-small btn-secondary mr-1" onClick={() => { setEditingMemberId(m.id); setEditingMemberVal(m.name); }}>
                                        Edit Name
                                    </button>
                                )}
                                {m.isActive && !m.isLead && (
                                    <button className="button is-small btn-secondary mr-1" onClick={() => makeLead(m.id)}>
                                        Make Lead
                                    </button>
                                )}
                                {m.isActive && !m.isLead && (
                                    <button className="button is-small btn-danger mr-1" onClick={() => deactivateMember(m.id)}>
                                        Deactivate
                                    </button>
                                )}
                                {!m.isActive && (
                                    <button className="button is-small btn-secondary" onClick={() => reactivateMember(m.id)}>
                                        Reactivate
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
