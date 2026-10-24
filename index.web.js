// Web entry (Metro picks index.web.js over index.js on web): same app as
// native, plus page-level CSS that only applies in the browser.
import './src/global.css';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
