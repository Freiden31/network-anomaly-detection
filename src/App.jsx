import './App.css'
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from './pages/Home';
import NotFound from "./pages/NotFound";
import Report from './pages/Report';
import ResetPasswordForm from './pages/ResetPassword';
import { MonitoringProvider } from './context/MonitoringContext';
import Account from "./pages/Account"
import Welcome from "./pages/Welcome"
import Alert from './pages/Alert';




function App() {

  return (
    
    <BrowserRouter>
      <Routes>
        <Route 
          element={
            <ProtectedRoute />
          }
        >

          <Route 
            path="/account" 
            element={ 
              <MonitoringProvider> 
                <Account />
              </MonitoringProvider>
            }
          />

          <Route 
            path="/" 
            element={ 
              <MonitoringProvider> 
                <Dashboard />
              </MonitoringProvider>
            }
          />

          <Route 
            path="/alert" 
            element={ 
              <MonitoringProvider> 
                <Alert />
              </MonitoringProvider>
            }
          />
            
          <Route 
            path="/report"
            element={ 
              <MonitoringProvider>
                <Report />
              </MonitoringProvider>
            }
          />
        </Route>
        
        <Route path='/welcome' element={< Welcome />}/>
        <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    
  )
}

export default App
