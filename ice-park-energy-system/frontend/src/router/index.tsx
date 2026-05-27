import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

// 懒加载页面组件
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const BigScreen = lazy(() => import('@/pages/BigScreen'))
const RealTimeMonitor = lazy(() => import('@/pages/RealTimeMonitor'))
const EnergyAnalysis = lazy(() => import('@/pages/EnergyAnalysis'))
const PredictionAnalysis = lazy(() => import('@/pages/PredictionAnalysis'))
const DeviceManagement = lazy(() => import('@/pages/DeviceManagement'))
const EnvironmentMonitor = lazy(() => import('@/pages/EnvironmentMonitor'))
const IceStatus = lazy(() => import('@/pages/IceStatus'))
const AlertCenter = lazy(() => import('@/pages/AlertCenter'))
const AIStrategy = lazy(() => import('@/pages/AIStrategy'))
const CarbonReport = lazy(() => import('@/pages/CarbonReport'))
const CarbonBlockchain = lazy(() => import('@/pages/CarbonBlockchain'))
const EdgeComputing = lazy(() => import('@/pages/EdgeComputing'))
const SystemManagement = lazy(() => import('@/pages/SystemManagement'))

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

// 路由守卫组件
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  const location = useLocation()
  
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return <>{children}</>
}

const AppRouter = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/big-screen" element={<BigScreen />} />
        
        {/* 需要登录的路由 */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/real-time" element={<PrivateRoute><RealTimeMonitor /></PrivateRoute>} />
        <Route path="/energy-analysis" element={<PrivateRoute><EnergyAnalysis /></PrivateRoute>} />
        <Route path="/prediction" element={<PrivateRoute><PredictionAnalysis /></PrivateRoute>} />
        <Route path="/devices" element={<PrivateRoute><DeviceManagement /></PrivateRoute>} />
        <Route path="/environment" element={<PrivateRoute><EnvironmentMonitor /></PrivateRoute>} />
        <Route path="/ice-status" element={<PrivateRoute><IceStatus /></PrivateRoute>} />
        <Route path="/alerts" element={<PrivateRoute><AlertCenter /></PrivateRoute>} />
        <Route path="/ai-strategy" element={<PrivateRoute><AIStrategy /></PrivateRoute>} />
        <Route path="/carbon-report" element={<PrivateRoute><CarbonReport /></PrivateRoute>} />
        <Route path="/carbon-blockchain" element={<PrivateRoute><CarbonBlockchain /></PrivateRoute>} />
        <Route path="/edge-computing" element={<PrivateRoute><EdgeComputing /></PrivateRoute>} />
        <Route path="/system" element={<PrivateRoute><SystemManagement /></PrivateRoute>} />
        
        {/* 404重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
