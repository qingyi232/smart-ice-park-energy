import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Statistic, Badge } from 'antd'
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import socketService from '@/services/socket'
import { deviceApi } from '@/services/api'

interface DeviceData {
  key: number
  name: string
  power: number
  status: string
  efficiency: string
}

const RealTimeMonitor = () => {
  const [realtimeData, setRealtimeData] = useState<number[]>(Array(20).fill(850))
  const [timeLabels, setTimeLabels] = useState<string[]>(Array(20).fill('').map((_, i) => `${i * 2}s`))
  const [totalPower, setTotalPower] = useState(856)
  const [deviceData, setDeviceData] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)

  // 获取设备数据
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await deviceApi.getAll() as unknown as any[]
        setDeviceData(res.map(d => ({
          key: d.id,
          name: d.name,
          power: d.power,
          status: d.status === 'running' ? '运行' : d.status === 'standby' ? '待机' : '故障',
          efficiency: d.efficiency
        })))
      } catch (error) {
        console.error('Failed to fetch devices:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDevices()
  }, [])

  // WebSocket实时数据
  useEffect(() => {
    socketService.connect()
    
    socketService.onEnergyData((data) => {
      const power = Math.round(data.totalPower)
      setTotalPower(power)
      setRealtimeData(prev => {
        const newData = [...prev.slice(1), power]
        return newData
      })
      setTimeLabels(prev => {
        const now = new Date()
        const newLabel = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`
        return [...prev.slice(1), newLabel]
      })
      
      // 更新设备功率
      if (data.devices) {
        setDeviceData(prev => prev.map(d => {
          const updated = data.devices.find((ud: any) => ud.id === d.key)
          return updated ? { ...d, power: Math.round(updated.power) } : d
        }))
      }
    })

    return () => {
      socketService.off('energy:realtime')
    }
  }, [])

  const realtimeOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: timeLabels,
      axisLabel: { fontSize: 10 }
    },
    yAxis: { type: 'value', name: 'kW', min: 600, max: 1200 },
    series: [{
      data: realtimeData,
      type: 'line',
      smooth: true,
      showSymbol: false,
      areaStyle: { 
        opacity: 0.3, 
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#1890ff' }, { offset: 1, color: 'rgba(24,144,255,0.1)' }] }
      },
      itemStyle: { color: '#1890ff' },
      lineStyle: { width: 2 }
    }]
  }

  const deviceColumns = [
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: '当前功率', dataIndex: 'power', key: 'power', render: (v: number) => (
      <span style={{ color: v > 0 ? '#1890ff' : '#999', fontWeight: 'bold' }}>{v} kW</span>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Badge status={s === '运行' ? 'processing' : s === '待机' ? 'warning' : 'error'} text={s} />
    )},
    { title: '能效等级', dataIndex: 'efficiency', key: 'efficiency', render: (e: string) => (
      <Tag color={e === 'A' ? 'green' : e === 'B' ? 'blue' : 'orange'}>{e}级</Tag>
    )},
  ]

  const rankingOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', name: 'kWh' },
    yAxis: { type: 'category', data: ['照明系统', '循环水泵-B', '循环水泵-A', '3号制冷机', '2号制冷机', '1号制冷机'] },
    series: [{
      type: 'bar',
      data: [180, 320, 350, 420, 2100, 2400],
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const colors = ['#52c41a', '#52c41a', '#faad14', '#faad14', '#ff4d4f', '#ff4d4f']
          return colors[params.dataIndex]
        }
      }
    }]
  }

  return (
    <div>
      {/* 实时指标 */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="实时总功率" 
              value={totalPower} 
              suffix="kW" 
              prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运行设备" value={deviceData.filter(d => d.status === '运行').length} suffix={`/ ${deviceData.length}`} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="负载率" value={Math.round(totalPower / 1200 * 100)} suffix="%" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="数据更新" value="实时" prefix={<ReloadOutlined spin style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title="实时功率曲线" 
            extra={
              <span style={{ color: '#52c41a' }}>
                <Badge status="processing" /> 实时更新中
              </span>
            }
          >
            <ReactECharts option={realtimeOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="设备实时状态" loading={loading}>
            <Table columns={deviceColumns} dataSource={deviceData} pagination={false} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="今日能耗排名">
            <ReactECharts option={rankingOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default RealTimeMonitor
