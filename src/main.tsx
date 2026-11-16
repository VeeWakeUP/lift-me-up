import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope/wght.css';
import '@fontsource-variable/alegreya/wght.css';
import '@fontsource-variable/alegreya/wght-italic.css';
import '@fontsource-variable/caveat/wght.css';
import '@fontsource/fira-sans-extra-condensed/latin-800.css';
import '@fontsource/fira-sans-extra-condensed/greek-800.css';
import '@fontsource/fira-sans-extra-condensed/latin-900.css';
import '@fontsource/fira-sans-extra-condensed/greek-900.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/home.css';
import './styles/motivation.css';
import './styles/bible.css';
import './styles/deck.css';
import './styles/screens.css';
import './styles/push.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
