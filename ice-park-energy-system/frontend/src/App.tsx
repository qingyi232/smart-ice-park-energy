import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router'
import MainLayout from './layouts/MainLayout'

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <AppRouter />
      </MainLayout>
    </BrowserRouter>
  )
}

export default App
