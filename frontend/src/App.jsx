import React from 'react';
import { useAppContext } from './context/AppContext';
import Navigation from './components/Navigation';
import SetupTeam from './components/SetupTeam';
import IdentitySelection from './components/IdentitySelection';
import ActionHub from './components/ActionHub';
import ManageTeam from './components/ManageTeam';
import ManageBacklog from './components/ManageBacklog';
import CycleSetup from './components/CycleSetup';
import PlanMyWork from './components/PlanMyWork';
import FreezeReview from './components/FreezeReview';
import ProgressUpdate from './components/ProgressUpdate';
import TeamDashboard from './components/TeamDashboard';
import PastCycles from './components/PastCycles';
import Footer from './components/Footer';
import CategoryDrillDown from './components/CategoryDrillDown';
import MemberDrillDown from './components/MemberDrillDown';
import TaskDrillDown from './components/TaskDrillDown';

function App() {
  const { theme, view, toast, showToast, errorMsg, showError, appSettings, currentUserId } = useAppContext();

  // Route views
  const renderView = () => {
    switch (view) {
      case 'setup': return <SetupTeam />;
      case 'identity': return <IdentitySelection />;
      case 'hub': return <ActionHub />;
      case 'team': return <ManageTeam />;
      case 'backlog':
      case 'backlogEdit': return <ManageBacklog />;
      case 'cycleSetup': return <CycleSetup />;
      case 'planning':
      case 'claim': return <PlanMyWork />;
      case 'freezeReview': return <FreezeReview />;
      case 'progress': return <ProgressUpdate />;
      case 'dashboard': return <TeamDashboard />;
      case 'pastCycles': return <PastCycles />;
      case 'catDrill': return <CategoryDrillDown />;
      case 'memberDrill': return <MemberDrillDown />;
      case 'taskDrill': return <TaskDrillDown />;
      default: return <ActionHub />;
    }
  };

  return (
    <div className={theme === 'dark' ? 'theme-dark' : 'theme-light'}>
      <Navigation />

      <main className="section">
        <div className="container" style={{ maxWidth: '960px' }}>
          {/* TOAST */}
          {toast && (
            <div className="notification is-app-success mb-4" style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 100, maxWidth: '350px' }}>
              <button className="delete" onClick={() => showToast('')}></button>
              <span>{toast}</span>
            </div>
          )}

          {/* ERROR TOAST */}
          {errorMsg && (
            <div className="notification is-app-danger mb-4" style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 100, maxWidth: '400px' }}>
              <button className="delete" onClick={() => showError('')}></button>
              <span>{errorMsg}</span>
            </div>
          )}

          {renderView()}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
