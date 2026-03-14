import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function CycleSetup() {
    const {
        goHome, activeMembers, planningCycles, setPlanningCycles, activeCycle,
        categoryAllocations, setCategoryAllocations, memberPlans, setMemberPlans,
        save, showToast, uid
    } = useAppContext();

    const isTuesday = (d) => {
        if (!d) return false;
        const dt = new Date(d + 'T12:00:00');
        return dt.getDay() === 2;
    };

    const addDays = (d, n) => {
        const dt = new Date(d + 'T12:00:00');
        dt.setDate(dt.getDate() + n);
        return dt.toISOString().slice(0, 10);
    };

    const getNextTuesday = () => {
        const d = new Date();
        while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    };

    const [cycleForm, setCycleForm] = useState({
        planningDate: activeCycle()?.planningDate || getNextTuesday(),
        memberIds: activeMembers().map(m => m.id),
        pctClient: 0,
        pctTech: 0,
        pctRD: 0
    });

    const [cycleError, setCycleError] = useState('');

    const pctSum = () => (parseInt(cycleForm.pctClient) || 0) + (parseInt(cycleForm.pctTech) || 0) + (parseInt(cycleForm.pctRD) || 0);

    const calcBudget = (cat) => {
        const cap = cycleForm.memberIds.length * 30;
        const pcts = {
            CLIENT_FOCUSED: parseInt(cycleForm.pctClient) || 0,
            TECH_DEBT: parseInt(cycleForm.pctTech) || 0,
            R_AND_D: parseInt(cycleForm.pctRD) || 0
        };
        const raw = {};
        let sum = 0;
        for (const c of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']) {
            raw[c] = Math.round(cap * pcts[c] / 100 * 2) / 2;
            sum += raw[c];
        }
        if (sum !== cap) {
            const sorted = ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D'].sort((a, b) => pcts[b] - pcts[a]);
            raw[sorted[0]] += (cap - sum);
        }
        return raw[cat];
    };

    const handleMemberToggle = (id) => {
        if (cycleForm.memberIds.includes(id)) {
            setCycleForm({ ...cycleForm, memberIds: cycleForm.memberIds.filter(mid => mid !== id) });
        } else {
            setCycleForm({ ...cycleForm, memberIds: [...cycleForm.memberIds, id] });
        }
    };

    const openPlanning = () => {
        setCycleError('');
        if (cycleForm.memberIds.length === 0) { setCycleError('Please pick at least one team member.'); return; }
        if (pctSum() !== 100) { setCycleError('Percentages must add up to 100.'); return; }
        if (!isTuesday(cycleForm.planningDate)) { setCycleError('Please pick a Tuesday.'); return; }

        let c = activeCycle();
        if (!c) {
            c = {
                id: uid(),
                state: 'PLANNING',
                createdAt: new Date().toISOString()
            };
            setPlanningCycles([...planningCycles, c]);
        } else {
            setPlanningCycles(planningCycles.map(pc => pc.id === c.id ? { ...pc, state: 'PLANNING' } : pc));
        }

        c.planningDate = cycleForm.planningDate;
        c.executionStartDate = addDays(cycleForm.planningDate, 1);
        c.executionEndDate = addDays(cycleForm.planningDate, 6);
        c.participatingMemberIds = cycleForm.memberIds;
        c.teamCapacity = cycleForm.memberIds.length * 30;
        c.state = 'PLANNING';

        // Create allocations
        const newAllocs = categoryAllocations.filter(a => a.cycleId !== c.id);
        for (const cat of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']) {
            newAllocs.push({
                id: uid(),
                cycleId: c.id,
                category: cat,
                percentage: cat === 'CLIENT_FOCUSED' ? parseInt(cycleForm.pctClient) : cat === 'TECH_DEBT' ? parseInt(cycleForm.pctTech) : parseInt(cycleForm.pctRD),
                budgetHours: calcBudget(cat)
            });
        }
        setCategoryAllocations(newAllocs);

        // Create member plans
        const newPlans = memberPlans.filter(p => p.cycleId !== c.id);
        for (const mid of cycleForm.memberIds) {
            newPlans.push({
                id: uid(),
                cycleId: c.id,
                memberId: mid,
                isReady: false,
                totalPlannedHours: 0
            });
        }
        setMemberPlans(newPlans);

        save();
        showToast('Planning is open! Team members can now plan their work.');
        goHome();
    };

    return (
        <div>
            <button className="button btn-secondary mb-4" onClick={goHome}>← Home</button>
            <h2 className="title is-4">Set Up This Week's Plan</h2>

            <div className="box mb-4">
                <label className="label">Planning date (pick a Tuesday)</label>
                <div className="control">
                    <input
                        className="input"
                        type="date"
                        value={cycleForm.planningDate}
                        onChange={e => setCycleForm({ ...cycleForm, planningDate: e.target.value })}
                    />
                </div>
                {cycleForm.planningDate && !isTuesday(cycleForm.planningDate) && (
                    <p className="help has-text-danger">{cycleForm.planningDate} is not a Tuesday. Please pick a Tuesday.</p>
                )}
                {cycleForm.planningDate && isTuesday(cycleForm.planningDate) && (
                    <p className="help">Work period: {addDays(cycleForm.planningDate, 1)} to {addDays(cycleForm.planningDate, 6)}</p>
                )}
            </div>

            <div className="box mb-4">
                <label className="label">Who is working this week?</label>
                {activeMembers().map(m => (
                    <label className="checkbox is-block mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} key={m.id}>
                        <input
                            type="checkbox"
                            checked={cycleForm.memberIds.includes(m.id)}
                            onChange={() => handleMemberToggle(m.id)}
                        />
                        <span>{m.name}</span>
                        {m.isLead && <span className="tag is-warning is-light">Lead</span>}
                    </label>
                ))}
                <p className="mt-2 text-secondary">
                    Team members selected: <strong>{cycleForm.memberIds.length}</strong>.
                    Total hours to plan: <strong>{cycleForm.memberIds.length * 30}</strong>
                </p>
            </div>

            <div className="box mb-4">
                <label className="label">How should the hours be split?</label>
                <div className="columns">
                    <div className="column">
                        <label className="label is-small">Client Focused %</label>
                        <input
                            className="input"
                            type="number"
                            value={cycleForm.pctClient}
                            onChange={e => setCycleForm({ ...cycleForm, pctClient: parseInt(e.target.value) || 0 })}
                            min="0" max="100"
                        />
                    </div>
                    <div className="column">
                        <label className="label is-small">Tech Debt %</label>
                        <input
                            className="input"
                            type="number"
                            value={cycleForm.pctTech}
                            onChange={e => setCycleForm({ ...cycleForm, pctTech: parseInt(e.target.value) || 0 })}
                            min="0" max="100"
                        />
                    </div>
                    <div className="column">
                        <label className="label is-small">R&D %</label>
                        <input
                            className="input"
                            type="number"
                            value={cycleForm.pctRD}
                            onChange={e => setCycleForm({ ...cycleForm, pctRD: parseInt(e.target.value) || 0 })}
                            min="0" max="100"
                        />
                    </div>
                </div>

                <p className={`has-text-weight-bold ${pctSum() === 100 ? 'has-text-success' : 'has-text-danger'}`}>
                    Total: <span>{pctSum()}</span>%
                    {pctSum() !== 100 ? <span> (must be 100%)</span> : <span> ✓</span>}
                </p>

                {pctSum() === 100 && cycleForm.memberIds.length > 0 && (
                    <div className="columns mt-2">
                        <div className="column has-text-centered">
                            <span className="tag cat-badge-CLIENT_FOCUSED">Client</span><br />
                            <strong>{calcBudget('CLIENT_FOCUSED')}h</strong>
                        </div>
                        <div className="column has-text-centered">
                            <span className="tag cat-badge-TECH_DEBT">Tech Debt</span><br />
                            <strong>{calcBudget('TECH_DEBT')}h</strong>
                        </div>
                        <div className="column has-text-centered">
                            <span className="tag cat-badge-R_AND_D">R&D</span><br />
                            <strong>{calcBudget('R_AND_D')}h</strong>
                        </div>
                    </div>
                )}
            </div>

            {cycleError && <p className="help has-text-danger mb-2">{cycleError}</p>}

            <button
                className="button btn-primary is-medium"
                onClick={openPlanning}
                disabled={cycleForm.memberIds.length === 0 || pctSum() !== 100 || !isTuesday(cycleForm.planningDate)}
            >
                Open Planning for the Team
            </button>
        </div>
    );
}
