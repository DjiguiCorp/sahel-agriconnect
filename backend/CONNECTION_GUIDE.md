# Guide de Connexion Frontend-Backend

## Configuration du Frontend React

Pour connecter le frontend React au backend, mettez à jour le fichier `web-dashboard/src/context/WebSocketContext.jsx` :

```javascript
// Changer l'URL du WebSocket
const newSocket = io('http://localhost:3001', {
  // ... reste de la config
});
```

## Configuration de l'API REST

Créez un fichier `web-dashboard/src/config/api.js` :

```javascript
const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // Auth
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  // Farmers
  registerFarmer: async (farmerData) => {
    const response = await fetch(`${API_BASE_URL}/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmerData)
    });
    return response.json();
  },

  getFarmers: async (token, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/farmers?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Cooperatives
  getCooperatives: async (region = null) => {
    const url = region 
      ? `${API_BASE_URL}/cooperatives/region/${encodeURIComponent(region)}`
      : `${API_BASE_URL}/cooperatives`;
    const response = await fetch(url);
    return response.json();
  },

  // Processors
  getProcessorsByRegion: async (region) => {
    const response = await fetch(`${API_BASE_URL}/processors/region/${encodeURIComponent(region)}`);
    return response.json();
  }
};

export default api;
```

## Mise à jour du FarmerRegistrationForm

Dans `web-dashboard/src/components/FarmerRegistrationForm.jsx`, remplacez l'appel WebSocket par un appel API :

```javascript
import api from '../config/api';

// Dans handleSubmit :
const response = await api.registerFarmer(newFarmer);
if (response.success) {
  // Succès
}
```

## Mise à jour de l'AdminLogin

Dans `web-dashboard/src/pages/AdminLogin.jsx` :

```javascript
import api from '../config/api';

const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await api.login(email, password);
  if (result.success) {
    // Stocker le token
    localStorage.setItem('adminToken', result.token);
    // Rediriger
  }
};
```

## Variables d'environnement Frontend

Créez `web-dashboard/.env` :

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

Puis utilisez dans le code :

```javascript
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;
```

