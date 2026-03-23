import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SubjectPage from './components/SubjectPage';
import TopicPage from './components/TopicPage';
import DiagnosticTest from './components/DiagnosticTest';
import Checkpoint from './components/Checkpoint';
import MockTest from './components/MockTest';
import BadgeDisplay from './components/BadgeDisplay';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subject/:subjectId" element={<SubjectPage />} />
            <Route path="/subject/:subjectId/topic/:topicId" element={<TopicPage />} />
            <Route path="/subject/:subjectId/diagnostic" element={<DiagnosticTest />} />
            <Route path="/subject/:subjectId/checkpoint" element={<Checkpoint />} />
            <Route path="/subject/:subjectId/mock-test" element={<MockTest />} />
            <Route path="/badges" element={<BadgeDisplay />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
