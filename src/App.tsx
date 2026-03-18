import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SubjectPage from './components/SubjectPage';
import TopicPage from './components/TopicPage';
import DiagnosticTest from './components/DiagnosticTest';
import Checkpoint from './components/Checkpoint';
import BadgeDisplay from './components/BadgeDisplay';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subject/:subjectId" element={<SubjectPage />} />
            <Route path="/subject/:subjectId/topic/:topicId" element={<TopicPage />} />
            <Route path="/subject/:subjectId/diagnostic" element={<DiagnosticTest />} />
            <Route path="/subject/:subjectId/checkpoint" element={<Checkpoint />} />
            <Route path="/badges" element={<BadgeDisplay />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
