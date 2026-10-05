import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { CasesPage } from './components/cases/CasesPage';
import { UploadPage } from './components/upload/UploadPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { DocumentDetailPage } from './components/documents/DocumentDetailPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { RoadmapPage } from './components/roadmap/RoadmapPage';
import { PlaceholderView } from './components/common/PlaceholderView';
import { AccessDenied } from './components/common/AccessDenied';
import { NavItemKey, Role } from './types';

// Role-based permissions per PRD section 2
const NAV_ROLE_PERMISSIONS: Partial<Record<NavItemKey, Role[]>> = {
  upload: ['IO', 'FORENSIC_ANALYST'],
  // Auditor cannot view document content, but can view ledger/audit
};

const MainWorkspace: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [currentNav, setCurrentNav] = useState<NavItemKey>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [deniedAttempt, setDeniedAttempt] = useState<{
    requiredRoles: Role[];
    action: string;
  } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-3 border-[#14213D] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
          Initializing SAKSHYA OS Secure Enclave...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigate = (key: NavItemKey) => {
    setDeniedAttempt(null);
    const requiredRoles = NAV_ROLE_PERMISSIONS[key];

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      setDeniedAttempt({
        requiredRoles,
        action: `Navigate to ${key.toUpperCase()}`,
      });
      return;
    }

    if (key === 'documents') {
      setSelectedDocId(null);
    }

    setCurrentNav(key);
  };

  const renderContent = () => {
    if (deniedAttempt) {
      return (
        <AccessDenied
          requiredRoles={deniedAttempt.requiredRoles}
          attemptedAction={deniedAttempt.action}
          onBackToDashboard={() => {
            setDeniedAttempt(null);
            setCurrentNav('dashboard');
          }}
          onSwitchPersona={() => {
            setDeniedAttempt(null);
            logout();
          }}
        />
      );
    }

    switch (currentNav) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;

      case 'cases':
        return <CasesPage />;

      case 'upload':
        return (
          <UploadPage
            onNavigate={handleNavigate}
            onSelectDocument={(docId) => {
              setSelectedDocId(docId);
              setCurrentNav('documents');
            }}
          />
        );

      case 'documents':
        if (selectedDocId) {
          return (
            <DocumentDetailPage
              documentId={selectedDocId}
              onBack={() => setSelectedDocId(null)}
              onNavigate={handleNavigate}
            />
          );
        }
        return (
          <DocumentsPage
            onNavigate={handleNavigate}
            onSelectDocument={(docId) => setSelectedDocId(docId)}
          />
        );

      case 'search':
        return (
          <PlaceholderView
            navKey="search"
            stageNumber={6}
            stageTitle="Smart Evidence Search"
            description="MiniSearch in-memory index over decrypted evidence with highlighted snippets and case filters."
            onGoToDashboard={() => setCurrentNav('dashboard')}
          />
        );

      case 'verify':
        return (
          <PlaceholderView
            navKey="verify"
            stageNumber={7}
            stageTitle="Public Document Verification"
            description="Zero-knowledge verification portal: uploads compare against ledger hashes and return MATCH / NO MATCH without storing files."
            onGoToDashboard={() => setCurrentNav('dashboard')}
          />
        );

      case 'integrity':
        return (
          <PlaceholderView
            navKey="integrity"
            stageNumber={7}
            stageTitle="Node Consensus & Integrity Checker"
            description="Police, Forensic Lab, and Court simulated witness nodes comparing head hashes for instant mismatch detection."
            onGoToDashboard={() => setCurrentNav('dashboard')}
          />
        );

      case 'audit':
        return (
          <PlaceholderView
            navKey="audit"
            stageNumber={3}
            stageTitle="Custody Ledger & Audit Trail"
            description="Append-only hash chain visualizer, block inspector, and tamper-evident CSV export (Scheduled for Stage 3)."
            onGoToDashboard={() => setCurrentNav('dashboard')}
          />
        );

      case 'settings':
        return <SettingsPage />;

      case 'roadmap':
        return <RoadmapPage />;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppShell currentNav={currentNav} onNavigate={handleNavigate}>
      {renderContent()}
    </AppShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainWorkspace />
    </AuthProvider>
  );
}
