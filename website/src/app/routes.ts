import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Tenders } from './pages/Tenders';
import { TenderDetail } from './pages/TenderDetail';
import { TenderDownloadPdf } from './pages/TenderDownloadPdf';
import { Pricing } from './pages/Pricing';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { Contact } from './pages/Contact';
import { Categories } from './pages/Categories';
import { NotFound } from './pages/NotFound';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { SavedTenders } from './pages/SavedTenders';
import { EditProfile } from './pages/EditProfile';
import { AlertSettings } from './pages/AlertSettings';
import { ChangePassword } from './pages/ChangePassword';
import { TenderHistory } from './pages/TenderHistory';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'tenders', Component: Tenders },
      { path: 'tenders/:id/download-pdf', Component: TenderDownloadPdf },
      { path: 'tender/:id', Component: TenderDetail },
      { path: 'categories', Component: Categories },
      { path: 'pricing', Component: Pricing },
      { path: 'about', Component: About },
      { path: 'services', Component: Services },
      { path: 'contact', Component: Contact },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'dashboard', Component: Dashboard },
      { path: 'saved-tenders', Component: SavedTenders },
      { path: 'edit-profile', Component: EditProfile },
      { path: 'alert-settings', Component: AlertSettings },
      { path: 'change-password', Component: ChangePassword },
      { path: 'tender-history', Component: TenderHistory },
      { path: '*', Component: NotFound },
    ],
  },
]);
