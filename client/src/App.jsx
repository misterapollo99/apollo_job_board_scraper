import { API_BASE_URL } from './config';
import { API_BASE_URL } from './config';
import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import StepScrape from './components/StepScrape';
import StepReview from './components/StepReview';
import StepEnrich from './components/StepEnrich';
import StepResults from './components/StepResults';
import StepExport from './components/StepExport';
import StepSelectCompany from './components/StepSelectCompany';
import StepFindContacts from './components/StepFindContacts';
import StepExportContacts from './components/StepExportContacts';
import ApiKeyModal from './components/ApiKeyModal';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [scrapedJobs, setScrapedJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [enrichedCompanies, setEnrichedCompanies] = useState([]);
  const [enrichmentProgress, setEnrichmentProgress] = useState(null);
  const [scrapeSource, setScrapeSource] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // People enrichment state
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [creditsUsed, setCreditsUsed] = useState({ emails: 0, phones: 0 });

  // Check API key on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config`)
      .then(res => res.json())
      .then(data => setHasApiKey(data.hasApiKey))
      .catch(() => {});
  }, []);

  const handleScrapeComplete = useCallback((jobs, source) => {
    setScrapedJobs(jobs);
    setScrapeSource(source);
    setCurrentStep(2);
  }, []);

  const handleSelectionComplete = useCallback((selected) => {
    setSelectedJobs(selected);
    setCurrentStep(3);
  }, []);

  const handleEnrichmentComplete = useCallback((companies) => {
    setEnrichedCompanies(companies);
    setCurrentStep(4);
  }, []);

  const handleGoToExport = useCallback(() => {
    setCurrentStep(5);
  }, []);

  const handleCompanySelected = useCallback((company) => {
    setSelectedCompany(company);
    setCurrentStep(7);
  }, []);

  const handleContactsFound = useCallback((foundContacts, company, credits) => {
    setContacts(foundContacts);
    setSelectedCompany(company);
    setCreditsUsed(credits);
    setCurrentStep(9);
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepScrape onComplete={handleScrapeComplete} />;
      case 2:
        return (
          <StepReview
            jobs={scrapedJobs}
            source={scrapeSource}
            onComplete={handleSelectionComplete}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <StepEnrich
            companies={selectedJobs}
            onComplete={handleEnrichmentComplete}
            onProgress={setEnrichmentProgress}
          />
        );
      case 4:
        return (
          <StepResults
            companies={enrichedCompanies}
            onExport={handleGoToExport}
            onFindContacts={() => setCurrentStep(6)}
          />
        );
      case 5:
        return (
          <StepExport
            companies={enrichedCompanies}
            onBack={() => setCurrentStep(4)}
          />
        );
      case 6:
        return (
          <StepSelectCompany
            companies={enrichedCompanies}
            onSelect={handleCompanySelected}
          />
        );
      case 7:
        return (
          <StepFindContacts
            selectedCompany={selectedCompany}
            onComplete={handleContactsFound}
            onBack={() => setCurrentStep(6)}
          />
        );
      case 9:
        return (
          <StepExportContacts
            contacts={contacts}
            selectedCompany={selectedCompany}
            creditsUsed={creditsUsed}
            onBack={() => setCurrentStep(7)}
          />
        );
      default:
        return null;
    }
  };

  const completedSteps = new Set();
  if (scrapedJobs.length > 0) completedSteps.add(1);
  if (selectedJobs.length > 0) completedSteps.add(2);
  if (enrichedCompanies.length > 0) {
    completedSteps.add(3);
    completedSteps.add(4);
    completedSteps.add(5);
  }
  if (selectedCompany) completedSteps.add(6);
  if (contacts.length > 0) {
    completedSteps.add(7);
    completedSteps.add(8);
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={(step) => {
          // Only allow navigating to completed steps or current step
          if (completedSteps.has(step) || step <= currentStep) {
            setCurrentStep(step);
          }
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onApiSettings={() => setShowApiModal(true)}
          hasApiKey={hasApiKey}
        />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {renderStep()}
        </main>
      </div>
      {showApiModal && (
        <ApiKeyModal
          onClose={() => setShowApiModal(false)}
          onSave={(key) => {
            setHasApiKey(true);
            setShowApiModal(false);
          }}
        />
      )}
    </div>
  );
}
