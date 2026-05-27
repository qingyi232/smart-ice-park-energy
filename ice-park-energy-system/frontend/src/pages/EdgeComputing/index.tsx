import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Progress, Badge, Spin, message } from 'antd'
import { CloudServerOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

interface EdgeNode {
  key: number
  name: string
  location: string
  status: string
  cpu: number
  memory: number
  network: number
  tasks: number
}

interface Task {
  key: number
  name: string
  node: string
  status: string
  frequency: string
  lastRun: string
}

const EdgeComputing = () => {
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<EdgeNode[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [cpuHistory, setCpuHistory] = useState<number[][]>([])

  // 模拟数据
  useEffect(() => {
    const initData = () => {
      setNodes([
        { key: 1, name: 'Edge-Node-A1', location: 'A区机房', status: 'online', cpu: 45, memory: 62, network: 128, tasks: 12 },
        { key: 2, name: 'Edge-Node-A2', location: 'A区机房', status: 'online', cpu: 38, memory: 55, network: 96, tasks: 8 },
        { key: 3, name: 'Edge-Node-B1', location: 'B区机房', status: 'online', cpu: 72, memory: 78, network: 256, tasks: 18 },
        { key: 4, name: 'Edge-Node-C1', location: 'C区机房', status: 'warning', cpu: 88, memory: 85, network: 312, tasks: 22 },
        { key: 5, name: 'Edge-Node-D1', location: '中控室', status: 'offline', cpu: 0, memory: 0, network: 0, tasks: 0 },
      ])

      setTasks([
        { key: 1, name: '温度数据采集', node: 'Edge-Node-A1', status: 'running', frequency: '1s', lastRun: '2024-01-15 15:32:18' },
        { key: 2, name: '设备状态监控', node: 'Edge-Node-A1', status: 'running', frequency: '5s', lastRun: '2024-01-15 15:32:15' },
        { key: 3, name: '能耗数据聚合', node: 'Edge-Node-B1', status: 'running', frequency: '1min', lastRun: '2024-01-15 15:32:00' },
        { key: 4, name: 'AI推理-异常检测', node: 'Edge-Node-B1', status: 'running', frequency: '10s', lastRun: '2024-01-15 15:32:10' },
        { key: 5, name: '视频流分析', node: 'Edge-Node-C1', status: 'warning', frequency: '实时', lastRun: '2024-01-15 15:30:00' },
        { key: 6, name: '数据同步-云端', node: 'Edge-Node-D1', status: 'stopped', frequency: '5min', lastRun: '2024-01-15 14:00:00' },
      ])

      // 初始化CPU历史数据
      setCpuHistory([
        Array.from({ length: 10 }, () => Math.random() * 20 + 35),
        Array.from({ length: 10 }, () => Math.random() * 20 + 30),
        Array.from({ length: 10 }, () => Math.random() * 20 + 60),
        Array.from({ length: 10 }, () => Math.random() * 20 + 75),
      ])

      setLoading(false)
    }

    initData()

    // 模拟实时更新
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => {
        if (node.status === 'offline') return node
        return {
          ...node,
          cpu: Math.min(100, Math.max(10, node.cpu + (Math.random() * 10 - 5))),
          memory: Math.min(100, Math.max(20, node.memory + (Math.random() * 6 - 3))),
          network: Math.max(0, node.network + (Math.random() * 50 - 25))
        }
      }))

      setCpuHistory(prev => prev.map(history => {
        const newHistory = [...history.slice(1), Math.random() * 30 + 40]
        return newHistory
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // CPU趋势图
  const cpuTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: nodes.filter(n => n.status !== 'offline').map(n => n.name) },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 10 }, (_, i) => `${(i + 1) * 3}s前`)
    },
    yAxis: { type: 'value', name: 'CPU %', max: 100 },
    series: nodes.filter(n => n.status !== 'offline').map((n, i) => ({
      name: n.name,
      type: 'line',
      smooth: true,
      data: cpuHistory[i] || [],
      itemStyle: { color: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f'][i] }
    }))
  }

  // 资源分布图
  const resourceOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['CPU', '内存'] },
    grid: { left: 100, right: 30, top: 30, bottom: 30 },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: nodes.filter(n => n.status !== 'offline').map(n => n.name) },
    series: [
      {
        name: 'CPU',
        type: 'bar',
        data: nodes.filter(n => n.status !== 'offline').map(n => n.cpu.toFixed(0)),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '内存',
        type: 'bar',
        data: nodes.filter(n => n.status !== 'offline').map(n => n.memory.toFixed(0)),
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  const nodeColumns = [
    { title: '节点名称', dataIndex: 'name', render: (n: string) => (
      <span><CloudServerOutlined style={{ marginRight: 8, color: '#1890ff' }} />{n}</span>
    )},
    { title: '位置', dataIndex: 'location', width: 100 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: string) => (
      <Badge
        status={s === 'online' ? 'success' : s === 'warning' ? 'warning' : 'error'}
        text={s === 'online' ? '在线' : s === 'warning' ? '负载高' : '离线'}
      />
    )},
    { title: 'CPU', dataIndex: 'cpu', width: 150, render: (v: number, record: EdgeNode) => (
      record.status === 'offline' ? '-' :
      <Progress percent={Math.round(v)} size="small" status={v > 80 ? 'exception' : v > 60 ? 'normal' : 'success'} />
    )},
    { title: '内存', dataIndex: 'memory', width: 150, render: (v: number, record: EdgeNode) => (
      record.status === 'offline' ? '-' :
      <Progress percent={Math.round(v)} size="small" status={v > 80 ? 'exception' : v > 60 ? 'normal' : 'success'} />
    )},
    { title: '网络(KB/s)', dataIndex: 'network', width: 100, render: (v: number, record: EdgeNode) => (
      record.status === 'offline' ? '-' : Math.round(v)
    )},
    { title: '运行任务', dataIndex: 'tasks', width: 80 },
  ]

  const taskColumns = [
    { title: '任务名称', dataIndex: 'name' },
    { title: '运行节点', dataIndex: 'node', width: 140 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: string) => (
      <Tag
        icon={s === 'running' ? <CheckCircleOutlined /> : s === 'warning' ? <WarningOutlined /> : <CloseCircleOutlined />}
        color={s === 'running' ? 'success' : s === 'warning' ? 'warning' : 'error'}
      >
        {s === 'running' ? '运行中' : s === 'warning' ? '异常' : '已停止'}
      </Tag>
    )},
    { title: '执行频率', dataIndex: 'frequency', width: 80 },
    { title: '最后执行', dataIndex: 'lastRun', width: 160 },
  ]

  const onlineCount = nodes.filter(n => n.status === 'online').length
  const warningCount = nodes.filter(n => n.status === 'warning').length
  const runningTasks = tasks.filter(t => t.status === 'running').length

  return (
    <Spin spinning={loading}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="边缘节点" value={nodes.length} suffix="个" icon={<CloudServerOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="在线节点" value={onlineCount} suffix="个" valueStyle={{ color: '#52c41a' }} icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运行任务" value={runningTasks} suffix="个" icon={<Badge status="processing" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="异常节点" value={warningCount + nodes.filter(n => n.status === 'offline').length} suffix="个" valueStyle={{ color: warningCount > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* 节点状态表格 */}
      <Card title="节点状态监控" style={{ marginTop: 16 }} extra={<Badge status="processing" text="实时更新中" />}>
        <Table columns={nodeColumns} dataSource={nodes} pagination={false} size="small" />
      </Card>

      {/* 图表 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="CPU使用趋势">
            <ReactECharts option={cpuTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="资源使用分布">
            <ReactECharts option={resourceOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 任务列表 */}
      <Card title="任务分发状态" style={{ marginTop: 16 }}>
        <Table columns={taskColumns} dataSource={tasks} pagination={false} size="small" />
      </Card>
    </Spin>
  )
}

const Statistic = ({ title, value, suffix, valueStyle, icon }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    {icon && <span style={{ fontSize: 24 }}>{icon}</span>}
    <div>
      <div style={{ color: '#666', fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', ...valueStyle }}>
        {value}<span style={{ fontSize: 14, fontWeight: 'normal' }}>{suffix}</span>
      </div>
    </div>
  </div>
)

export default EdgeComputing
