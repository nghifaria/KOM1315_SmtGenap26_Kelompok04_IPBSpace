import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './core/router/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right" 
          containerStyle={{
            top: '120px',
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;