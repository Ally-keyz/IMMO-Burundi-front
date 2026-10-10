import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import RouteLoader from './components/loading/RouteLoader';
import ProtectedRoute from './components/ProtectedRoute';
import AgentRoute from './components/AgentRoute';
import NonAgentRoute from './components/NonAgentRoute';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import BuyPage from './pages/BuyPage';
import RentPage from './pages/RentPage';
import LandPage from './pages/LandPage';
import CommercialPage from './pages/CommercialPage';
import FeaturedPage from './pages/FeaturedPage';
import VerifiedPage from './pages/VerifiedPage';
import AgentsPage from './pages/AgentsPage';
import AgentChannelPage from './pages/AgentChannelPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SetupAccountPage from './pages/SetupAccountPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import ListPropertyPage from './pages/ListPropertyPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsConditionsPage from './pages/legal/TermsConditionsPage';
import VerificationDisclaimerPage from './pages/legal/VerificationDisclaimerPage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';
import LocationPage from './pages/LocationPage';

export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <NotificationProvider>
              <RouteLoader>
                <Layout>
                  <Routes>
                    <Route path="/" element={<NonAgentRoute><HomePage /></NonAgentRoute>} />
                    <Route path="/search" element={<NonAgentRoute><SearchPage /></NonAgentRoute>} />
                    <Route path="/buy" element={<NonAgentRoute><BuyPage /></NonAgentRoute>} />
                    <Route path="/rent" element={<NonAgentRoute><RentPage /></NonAgentRoute>} />
                    <Route path="/land" element={<NonAgentRoute><LandPage /></NonAgentRoute>} />
                    <Route path="/commercial" element={<NonAgentRoute><CommercialPage /></NonAgentRoute>} />
                    <Route path="/featured" element={<NonAgentRoute><FeaturedPage /></NonAgentRoute>} />
                    <Route path="/verified" element={<NonAgentRoute><VerifiedPage /></NonAgentRoute>} />
                    <Route path="/agents" element={<NonAgentRoute><AgentsPage /></NonAgentRoute>} />
                    <Route path="/agent/:id" element={<NonAgentRoute><AgentChannelPage /></NonAgentRoute>} />
                    <Route path="/property/:id" element={<NonAgentRoute><PropertyDetailPage /></NonAgentRoute>} />
                    <Route path="/immobilier/:slug" element={<NonAgentRoute><LocationPage /></NonAgentRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/setup-account" element={<SetupAccountPage />} />
                <Route path="/setup-account/:token" element={<SetupAccountPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/register" element={<Navigate to="/signup" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/list-property"
                  element={
                    <AgentRoute>
                      <ListPropertyPage />
                    </AgentRoute>
                  }
                />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsConditionsPage />} />
                <Route path="/verification-disclaimer" element={<VerificationDisclaimerPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </Layout>
              </RouteLoader>
            </NotificationProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}