import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { SyncProvider } from './context/SyncContext.jsx';

console.log('index.jsx loading');
console.log('root element:', document.getElementById('root'));

ReactDOM.createRoot(document.getElementById('root')).render(
	<Router>
		<AuthProvider>
			<SyncProvider>
				<App />
			</SyncProvider>
		</AuthProvider>
	</Router>
);

console.log('App mounted');
