import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import LeadSearch from "./pages/LeadSearch.jsx";
import Properties from "./pages/Properties.jsx";
import FollowUps from "./pages/FollowUps.jsx";
import Meetings from "./pages/Meetings.jsx";
import Proposals from "./pages/Proposals.jsx";
import SocialMedia from "./pages/SocialMedia.jsx";
import Team from "./pages/Team.jsx";
import BookMeeting from "./pages/BookMeeting.jsx";
import Login from "./pages/Login.jsx";
import BulkImport from "./pages/BulkImport.jsx";
import ReviewCentre from "./pages/ReviewCentre.jsx";
import ClientFeedback from "./pages/ClientFeedback.jsx";
import Settings from "./pages/Settings.jsx";
import MarketIntelligence from "./pages/MarketIntelligence.jsx";
import AgentRecruitment from "./pages/AgentRecruitment.jsx";
import { useUser } from "./context/UserContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

export default function App() {
  const { isLoggedIn, isAdmin } = useUser();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/book-meeting" element={<BookMeeting />} />
      <Route path="/feedback" element={<ClientFeedback />} />

      {/* Protected CRM Portal Routes */}
      <Route
        path="/*"
        element={
          !isLoggedIn ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="app-shell">
              <Sidebar />
              <main className="main" style={{ position: "relative" }}>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/leads/:id" element={<LeadDetail />} />
                    <Route path="/followups" element={<FollowUps />} />
                    <Route path="/properties" element={<Properties />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Shared Sales & Core Modules (Accessible by both Admin & Sales Executives) */}
                    <Route path="/meetings" element={<Meetings />} />
                    <Route path="/proposals" element={<Proposals />} />
                    <Route path="/social" element={<SocialMedia />} />
                    <Route path="/lead-search" element={<LeadSearch />} />

                    {/* Restricted Admin-Only Modules */}
                    <Route
                      path="/agent-recruitment"
                      element={isAdmin ? <AgentRecruitment /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/market-intelligence"
                      element={isAdmin ? <MarketIntelligence /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/bulk-import"
                      element={isAdmin ? <BulkImport /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/review-centre"
                      element={isAdmin ? <ReviewCentre /> : <Navigate to="/" replace />}
                    />
                    <Route
                      path="/team"
                      element={isAdmin ? <Team /> : <Navigate to="/" replace />}
                    />

                    {/* Catch-all Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>
          )
        }
      />
    </Routes>
  );
}
