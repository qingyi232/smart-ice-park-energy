import { useState, useEffect } from 'react'
import { Layout, Menu, theme, Dropdown, Avatar, Badge, Space, message } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  DesktopOutlined,
  MonitorOutlined,
  BarChartOutlined,
  LineChartOutlined,
  SettingOutlined,
  CloudOutlined,
  AlertOutlined,
  RobotOutlined,
  FileTextOutlined,
  BlockOutlined,
  ClusterOutlined,
  ToolOutlined,
  ExperimentOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  FullscreenOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '综合监控首页' },
  { key: '/big-screen', icon: <DesktopOutlined />, label: '中央可视化大屏' },
  { key: '/real-time', icon: <MonitorOutlined />, label: '实时监测' },
  { key: '/energy-analysis', icon: <BarChartOutlined />, label: '能耗分析' },
  { key: '/prediction', icon: <LineChartOutlined />, label: '预测分析' },
  { key: '/devices', icon: <ToolOutlined />, label: '设备管理' },
  { key: '/environment', icon: <CloudOutlined />, label: '环境监测' },
  { key: '/ice-status', icon: <ExperimentOutlined />, label: '冰块状态' },
  { key: '/alerts', icon: <AlertOutlined />, label: '预警中心' },
  { key: '/ai-strategy', icon: <RobotOutlined />, label: 'AI策略优化' },
  { key: '/carbon-report', icon: <FileTextOutlined />, label: '能碳报表' },
  { key: '/carbon-blockchain', icon: <BlockOutlined />, label: '碳资产区块链' },
  { key: '/edge-computing', icon: <ClusterOutlined />, label: '边缘计算监控' },
  { key: '/system', icon: <SettingOutlined />, label: '系统管理' },
]

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer } } = theme.useToken()
  const { user, pendingAlerts } = useAppStore()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    message.success('已退出登录')
    navigate('/login')
  }

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  // 大屏和登录页面不显示布局
  if (location.pathname === '/big-screen' || location.pathname === '/login') {
    return <>{children}</>
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
        style={{ 
          background: 'linear-gradient(180deg, #001529 0%, #002140 100%)',
        }}
      >
        <div className="logo" style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 20 : 16,
          fontWeight: 'bold',
          padding: '0 16px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '❄️' : '❄️ 智慧冰雕园区'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: 18, fontWeight: 500, color: '#1a3a5c' }}>
            能源与碳管理系统
          </span>
          <Space size="large">
            <span style={{ color: '#666' }}>
              {currentTime.toLocaleDateString('zh-CN')} {currentTime.toLocaleTimeString('zh-CN')}
            </span>
            <Badge count={pendingAlerts} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/alerts')} />
            </Badge>
            <FullscreenOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={handleFullscreen} />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <span>{user?.name || '管理员'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 'calc(100vh - 112px)', overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
