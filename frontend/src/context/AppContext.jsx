import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

function uid() { return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) }) }
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { console.error(e) } }

export function AppProvider({ children }) {
    const [theme, setTheme] = useState(() => lsGet('wpt_theme', 'light'));
    const [view, setViewState] = useState('identity');
    const [toast, setToastState] = useState('');
    const [errorMsg, setErrorMsgState] = useState('');

    const [appSettings, setAppSettings] = useState(() => lsGet('wpt_appSettings', { setupComplete: false, dataVersion: 1 }));
    const [teamMembers, setTeamMembers] = useState(() => lsGet('wpt_teamMembers', []));
    const [backlogEntries, setBacklogEntries] = useState(() => lsGet('wpt_backlogEntries', []));
    const [planningCycles, setPlanningCycles] = useState(() => lsGet('wpt_planningCycles', []));
    const [categoryAllocations, setCategoryAllocations] = useState(() => lsGet('wpt_categoryAllocations', []));
    const [memberPlans, setMemberPlans] = useState(() => lsGet('wpt_memberPlans', []));
    const [taskAssignments, setTaskAssignments] = useState(() => lsGet('wpt_taskAssignments', []));
    const [progressUpdates, setProgressUpdates] = useState(() => lsGet('wpt_progressUpdates', []));

    const [currentUserId, setCurrentUserId] = useState(null);
    const [dashCycleId, setDashCycleId] = useState(null);

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmYes, setConfirmYes] = useState('Yes');
    const [confirmDanger, setConfirmDanger] = useState(false);

    useEffect(() => {
        lsSet('wpt_theme', theme);
    }, [theme]);

    // Save all main data structures on change
    useEffect(() => {
        lsSet('wpt_appSettings', appSettings);
        lsSet('wpt_teamMembers', teamMembers);
        lsSet('wpt_backlogEntries', backlogEntries);
        lsSet('wpt_planningCycles', planningCycles);
        lsSet('wpt_categoryAllocations', categoryAllocations);
        lsSet('wpt_memberPlans', memberPlans);
        lsSet('wpt_taskAssignments', taskAssignments);
        lsSet('wpt_progressUpdates', progressUpdates);
    }, [appSettings, teamMembers, backlogEntries, planningCycles, categoryAllocations, memberPlans, taskAssignments, progressUpdates]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    const setView = (newView) => {
        setViewState(newView);
        window.scrollTo(0, 0);
    };

    const showToast = (m) => {
        setToastState(m);
        setTimeout(() => setToastState(''), 3000);
    };

    const showError = (m) => {
        setErrorMsgState(m);
        setTimeout(() => setErrorMsgState(''), 5000);
    };

    // save() is a no-op in React — state is auto-persisted via useEffect above.
    // Components call save() after state updates; those updates trigger useEffect.
    const save = () => { };

    // Confirm modal
    const showConfirm = (title, text, action, yesLabel = 'Yes', isDanger = false) => {
        setConfirmTitle(title);
        setConfirmText(text);
        setConfirmAction(() => action);
        setConfirmYes(yesLabel);
        setConfirmDanger(isDanger);
        setConfirmModal(true);
    };

    const init = () => {
        if (!appSettings.setupComplete) {
            setView('setup');
            return;
        }
        const activeM = teamMembers.filter(m => m.isActive);
        if (activeM.length === 1 && activeM.find(m => m.isLead)) {
            setCurrentUserId(activeM[0].id);
            setView('hub');
        } else {
            setView('identity');
        }
    };

    useEffect(() => {
        // Only run on mount
        init();
        // eslint-disable-next-line
    }, []);

    const goHome = () => {
        setView('hub');
        setDashCycleId(activeCycle()?.id || null);
    };

    // ----- Helpers -----
    const activeMembers = () => teamMembers.filter(m => m.isActive);
    const getMember = (id) => teamMembers.find(m => m.id === id);
    const currentUserName = () => getMember(currentUserId)?.name || '';
    const isLead = () => getMember(currentUserId)?.isLead || false;

    const activeCycle = () => planningCycles.find(c => ['SETUP', 'PLANNING', 'FROZEN'].includes(c.state));
    const frozenCycle = () => planningCycles.find(c => c.state === 'FROZEN') || activeCycle();
    const isParticipating = () => {
        const c = activeCycle();
        return c ? c.participatingMemberIds.includes(currentUserId) : false;
    };

    const catLabel = (c) => ({ CLIENT_FOCUSED: 'Client Focused', TECH_DEBT: 'Tech Debt', R_AND_D: 'R&D' }[c] || c);
    const statusLabel = (s) => ({ NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', BLOCKED: 'Blocked' }[s] || s);

    // Backlog entry lookup
    const getEntry = (id) => backlogEntries.find(e => e.id === id);

    // Category budget helpers (based on active cycle allocations)
    const getCatBudget = (cat) => {
        const c = activeCycle();
        if (!c) return 0;
        const a = categoryAllocations.find(x => x.cycleId === c.id && x.category === cat);
        return a ? a.budgetHours : 0;
    };

    // Category claimed hours (sum of committed hours for this category across all member plans in active cycle)
    const getCatClaimed = (cat) => {
        const c = activeCycle();
        if (!c) return 0;
        const pids = memberPlans.filter(p => p.cycleId === c.id).map(p => p.id);
        return taskAssignments
            .filter(t => pids.includes(t.memberPlanId) && getEntry(t.backlogEntryId)?.category === cat)
            .reduce((s, t) => s + t.committedHours, 0);
    };

    // Identity logic
    const selectIdentity = (id) => {
        setCurrentUserId(id);
        setDashCycleId(activeCycle()?.id || null);
        setView('hub');
    };

    return (
        <AppContext.Provider value={{
            theme, toggleTheme,
            view, setView,
            toast, showToast,
            errorMsg, showError,
            appSettings, setAppSettings,
            teamMembers, setTeamMembers,
            backlogEntries, setBacklogEntries,
            planningCycles, setPlanningCycles,
            categoryAllocations, setCategoryAllocations,
            memberPlans, setMemberPlans,
            taskAssignments, setTaskAssignments,
            progressUpdates, setProgressUpdates,
            currentUserId, setCurrentUserId,
            dashCycleId, setDashCycleId,
            // Confirm modal state
            confirmModal, setConfirmModal,
            confirmTitle, confirmText, confirmAction,
            confirmYes, confirmDanger,
            // Functions
            save, showConfirm,
            goHome, init, activeMembers, getMember, currentUserName, isLead,
            activeCycle, frozenCycle, isParticipating,
            catLabel, statusLabel,
            getEntry, getCatBudget, getCatClaimed,
            selectIdentity,
            uid
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);
