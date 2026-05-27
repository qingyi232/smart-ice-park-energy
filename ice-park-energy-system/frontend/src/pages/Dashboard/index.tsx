import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Progress, List, Tag, message } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, ThunderboltOutlined, AlertOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import { energyApi, alertApi, strategyApi } from '@/services/api'
import socketService from '@/services/socket'
import styles from './index.module.scss'

interface EnergyOverview {
  today: { total: number; target: number; saving: number; savingRate: number }
  realtime: { power: number; load: number }
  comparison: { yesterday: number; lastWeek: number; lastMonth: number }
}

interface AlertItem {
  id: number
  level: string
  content: string
  time: string
  status: string
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<EnergyOverview | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [energyHistory, setEnergyHistory] = useState<number[]>([])
  const [timeLabels, setTimeLabels] = useState<string[]>([])
  const [realtimePower, setRealtimePower] = useState(0)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [overviewRes, alertsRes, historyRes, aiRes] = await Promise.all([
          energyApi.getOverview(),
          alertApi.getAll({ status: 'pending' }),
          energyApi.getHistory(24),
          strategyApi.getRecommendations()
        ])
        
        setOverview(overviewRes as unknown as EnergyOverview)
        setAlerts((alertsRes as unknown as AlertItem[]).slice(0, 5))
        
        const history = historyRes as unknown as any[]
        setEnergyHistory(history.map((h: any) => Math.round(h.energy)))
        setTimeLabels(history.map((h: any) => new Date(h.timestamp).getHours() + ':00'))
        
        setAiRecommendations((aiRes as any).recommendations || [])
      } catch (error) {
        message.error('数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // WebSocket实时数据
  useEffect(() => {
    socketService.connect()
    
    socketService.onEnergyData((data) => {
      setRealtimePower(Math.round(data.totalPower))
      setEnergyHistory(prev => {
        const newData = [...prev.slice(1), Math.round(data.totalPower)]
        return newData
      })
    })

    return () => {
      socketService.off('energy:realtime')
    }
  }, [])

  // 能耗趋势图配置
  const energyTrendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: timeLabels.length > 0 ? timeLabels : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: { type: 'value', name: 'kWh' },
    series: [{
      data: energyHistory.length > 0 ? energyHistory : [820, 932, 901, 1234, 1290, 1330, 1120],
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#1890ff' }, { offset: 1, color: 'rgba(24,144,255,0.1)' }] } },
      itemStyle: { color: '#1890ff' }
    }]
  }

  const todayTotal = overview?.today.total || 12580
  const savingRate = overview?.today.savingRate || 3.2
  const carbonReduction = (todayTotal * 0.0005).toFixed(1) // 简化碳排放计算
  const pendingAlertCount = alerts.filter(a => a.status === 'pending').length

  return (
    <div className={styles.dashboard}>
      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.statCard} ${styles.purple}`} loading={loading}>
            <Statistic
              title={<span style={{ color: '#fff' }}>今日总能耗</span>}
              value={todayTotal}
              suffix="kWh"
              valueStyle={{ color: '#fff' }}
              prefix={<ThunderboltOutlined />}
            />
            <div className={styles.trend}>
              {savingRate > 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />} 
              较昨日 {savingRate > 0 ? '-' : '+'}{Math.abs(savingRate)}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.statCard} ${styles.green}`} loading={loading}>
            <Statistic
              title={<span style={{ color: '#fff' }}>实时功率</span>}
              value={realtimePower || overview?.realtime.power || 856}
              suffix="kW"
              valueStyle={{ color: '#fff' }}
            />
            <Progress percent={overview?.realtime.load || 72} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" />
            <div className={styles.trend}>负载率 {overview?.realtime.load || 72}%</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.statCard} ${styles.blue}`} loading={loading}>
            <Statistic
              title={<span style={{ color: '#fff' }}>碳减排量</span>}
              value={carbonReduction}
              suffix="吨"
              valueStyle={{ color: '#fff' }}
            />
            <div className={styles.trend}>
              <ArrowUpOutlined /> 本月累计
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={`${styles.statCard} ${styles.orange}`} loading={loading} onClick={() => navigate('/alerts')} style={{ cursor: 'pointer' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>活跃预警</span>}
              value={pendingAlertCount || alerts.length}
              suffix="条"
              valueStyle={{ color: '#fff' }}
              prefix={<AlertOutlined />}
            />
            <div className={styles.trend}>点击查看详情</div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="今日能耗趋势" extra={<span style={{ color: '#1890ff' }}>实时更新中 <ReloadOutlined spin /></span>}>
            <ReactECharts option={energyTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="实时预警" extra={<a onClick={() => navigate('/alerts')}>查看全部</a>}>
            <List
              loading={loading}
              dataSource={alerts}
              locale={{ emptyText: '暂无预警' }}
              renderItem={(item: AlertItem) => (
                <List.Item>
                  <Tag color={item.level === 'warning' ? 'orange' : item.level === 'error' ? 'red' : item.level === 'info' ? 'blue' : 'green'}>
                    {item.level === 'warning' ? '警告' : item.level === 'error' ? '紧急' : item.level === 'info' ? '提示' : '成功'}
                  </Tag>
                  <span style={{ flex: 1, fontSize: 13 }}>{item.content}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* AI策略建议 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="AI优化策略建议" extra={<a onClick={() => navigate('/ai-strategy')}>进入策略库</a>}>
            <Row gutter={16}>
              {aiRecommendations.length > 0 ? aiRecommendations.map((rec, index) => (
                <Col span={8} key={index}>
                  <Card size="small" type="inner" title={rec.type} hoverable>
                    <p>{rec.suggestion}</p>
                    <Tag color="green">{rec.impact}</Tag>
                  </Card>
                </Col>
              )) : (
                <>
                  <Col span={8}>
                    <Card size="small" type="inner" title="制冷优化" hoverable onClick={() => navigate('/ai-strategy')}>
                      建议将2号机组功率降低15%，预计节省电量120kWh/天
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" type="inner" title="负载均衡" hoverable onClick={() => navigate('/ai-strategy')}>
                      建议在14:00-16:00高峰期启用备用机组分担负载
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" type="inner" title="预测性维护" hoverable onClick={() => navigate('/ai-strategy')}>
                      5号风机轴承温度异常，建议48小时内安排检修
                    </Card>
                  </Col>
                </>
              )}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="快捷入口">
            <Row gutter={16}>
              {[
                { title: '中央大屏', path: '/big-screen', icon: '🖥️', color: '#1890ff' },
                { title: '设备管理', path: '/devices', icon: '⚙️', color: '#52c41a' },
                { title: '冰块状态', path: '/ice-status', icon: '❄️', color: '#13c2c2' },
                { title: '碳资产', path: '/carbon-blockchain', icon: '🌱', color: '#722ed1' },
              ].map(item => (
                <Col span={6} key={item.path}>
                  <Card 
                    size="small" 
                    hoverable 
                    onClick={() => item.path === '/big-screen' ? window.open(item.path, '_blank') : navigate(item.path)}
                    style={{ textAlign: 'center', borderTop: `3px solid ${item.color}` }}
                  >
                    <div style={{ fontSize: 32 }}>{item.icon}</div>
                    <div style={{ marginTop: 8 }}>{item.title}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
