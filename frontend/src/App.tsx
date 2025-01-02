import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ScrollableLayout from './layouts/ScrollableLayout';
import { Landing } from './pages/Landing';
import { Authentication } from './pages/Authentication';
import { DarkModeProvider } from './contexts/DarkModeProvider';
import { AuthProvider } from './contexts/AuthenticationProvider';
import { ResetPassword } from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import { Pricing } from './pages/Pricing';
import { Articles } from './pages/Articles';
import { ApiProvider } from './contexts/ApiContext';
import { ArticlePage } from './pages/ArticlePage';
import { ProfileProvider } from './contexts/ProfileProvider';
import Onboarding from './pages/Onboarding';
import { Toaster } from './components/shadcn/toaster';

// Example components for different routes
const About = () => <ScrollableLayout><h2>About Page</h2></ScrollableLayout>;
const Contact = () => <ScrollableLayout><h2>Contact Page</h2></ScrollableLayout>;
const NotFound = () => <ScrollableLayout><h2>No Clue Mate...</h2></ScrollableLayout>

function App() {
  return (
    <div className='dark:bg-black'>
      <Router>
        <DarkModeProvider>
          <AuthProvider>
            <ProfileProvider>
              <ApiProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/pricing" element={<Pricing />} />

                  {/* Articles */}
                  <Route path="/articles" element={<Articles />} />
                  <Route path="/article/:slug" element={<ArticlePage />} />

                  {/* Authentication Pages */}
                  <Route path="/authentication" element={<Authentication />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Onboarding Pages */}
                  <Route path="/onboarding" element={<Onboarding />} />

                  {/* Main Page */}
                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </ApiProvider>
            </ProfileProvider>
          </AuthProvider>
        </DarkModeProvider>
      </Router>
    </div>
  );
}

export default App;