import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { SyncProvider } from './context/SyncContext.jsx';

console.log('index.jsx loading');
console.log('root element:', document.getElementById('root'));

ReactDOM.createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<AuthProvider>
			<SyncProvider>
				<App />
			</SyncProvider>
		</AuthProvider>
	</BrowserRouter>
);

console.log('App mounted');
