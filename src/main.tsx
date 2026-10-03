import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './workspace.css';
import {LanguageProvider} from './Language';

createRoot(document.getElementById('root')!).render(<React.StrictMode><LanguageProvider><App /></LanguageProvider></React.StrictMode>);

import './pixel-extras.css';
import './merchant-tools.css';
import './business-website.css';
import './accessibility-updates.css';
