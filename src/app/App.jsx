import DesktopShell from '../desktop/DesktopShell'
import { AppearanceProvider } from '../shared/appearance/AppearanceContext'
import './App.css'

function App() {
  return <AppearanceProvider><div className="desktop"><DesktopShell /></div></AppearanceProvider>
}

export default App
