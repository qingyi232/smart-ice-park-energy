import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Tabs, Progress, Timeline, message, Spin, Modal, Descriptions } from 'antd'
import { RobotOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ExperimentOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { strategyApi } from '@/services/api'

interface Strategy {
  key: number
  id: number
  name: string
  type: string
  expectedSave: string
  status: string
  confidence: number
  description: string
}

const AIStrategy = () => {
  const [loading, setLoading] = useState(true)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [executionHistory, setExecutionHistory] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [detailModal, setDetailModal] = useState(false)
  const [executing, setExecuting] = useState<number | null>(null)

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [strategiesRes, historyRes, recommendationsRes] = await Promise.all([
          strategyApi.getAll(),
          strategyApi.getHistory(),
          strategyApi.getRecommendations()
        ])
        setStrategies((strategiesRes as unknown as any[]).map(s => ({ ...s, key: s.id })))
        setExecutionHistory(historyRes as unknown as any[])
        setRecommendations((recommendationsRes as any).recommendations || [])
      } catch (error) {
        message.error('获取策略数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 执行策略
  const handleExecute = async (strategy: Strategy) => {
    setExecuting(strategy.id)
    try {
      await strategyApi.execute(strategy.id)
      message.success(`策略"${strategy.name}"执行成功`)
      // 更新状态
      setStrategies(prev => prev.map(s => s.id === strategy.id ? { ...s, status: 'executed' } : s))
      // 刷新历史
      const historyRes = await strategyApi.getHistory()
      setExecutionHistory(historyRes as unknown as any[])
    } catch (error) {
      message.error('策略执行失败')
    } finally {
      setExecuting(null)
    }
  }

  // 查看详情
  const handleViewDetail = (strategy: Strategy) => {
    setSelectedStrategy(strategy)
    setDetailModal(true)
  }

  // 优化对比图
  const optimizationOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['优化前', '优化后'] },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'] },
    yAxis: { type: 'value', name: 'kWh' },
    series: [
      {
        name: '优化前',
        type: 'line',
        data: [450, 420, 680, 920, 1050, 780],
        areaStyle: { opacity: 0.3, color: '#ff7a45' },
        itemStyle: { color: '#ff7a45' }
      },
      {
        name: '优化后',
        type: 'line',
        data: [380, 350, 580, 820, 920, 680],
        areaStyle: { opacity: 0.3, color: '#52c41a' },
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  // 策略评估雷达图
  const radarOption = {
    radar: {
      indicator: [
        { name: '节能效果', max: 100 },
        { name: '执行可行性', max: 100 },
        { name: '风险评估', max: 100 },
        { name: '成本效益', max: 100 },
        { name: '环境影响', max: 100 },
      ]
    },
    series: [{
      type: 'radar',
      data: [{
        value: [92, 88, 85, 90, 95],
        name: '当前策略评估',
        areaStyle: { opacity: 0.3, color: '#1890ff' },
        itemStyle: { color: '#1890ff' }
      }]
    }]
  }

  // 节能效果统计
  const savingStatsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value', name: 'kWh' },
    series: [{
      type: 'bar',
      data: [1200, 1500, 1800, 2100, 2400, 2580],
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#52c41a' }, { offset: 1, color: '#95de64' }]
        },
        borderRadius: [4, 4, 0, 0]
      },
      label: { show: true, position: 'top', formatter: '{c}' }
    }]
  }

  const columns = [
    { title: '策略名称', dataIndex: 'name', key: 'name', render: (name: string, record: Strategy) => (
      <a onClick={() => handleViewDetail(record)}>{name}</a>
    )},
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t: string) => (
      <Tag color={t === 'AI推荐' ? 'blue' : 'default'} icon={t === 'AI推荐' ? <RobotOutlined /> : null}>{t}</Tag>
    )},
    { title: '预期节能', dataIndex: 'expectedSave', key: 'expectedSave', width: 100, render: (v: string) => (
      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{v}</span>
    )},
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', width: 150, render: (c: number) => (
      <Progress percent={c} size="small" strokeColor={c > 90 ? '#52c41a' : c > 80 ? '#1890ff' : '#faad14'} />
    )},
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
      <Tag icon={s === 'executed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />} color={s === 'executed' ? 'success' : 'warning'}>
        {s === 'executed' ? '已执行' : '待执行'}
      </Tag>
    )},
    { title: '操作', key: 'action', width: 120, render: (_: any, record: Strategy) => (
      record.status === 'pending' ?
        <Button type="primary" size="small" icon={<PlayCircleOutlined />} loading={executing === record.id} onClick={() => handleExecute(record)}>
          执行
        </Button> :
        <Button size="small" disabled>已执行</Button>
    )},
  ]

  const pendingCount = strategies.filter(s => s.status === 'pending').length
  const executedCount = strategies.filter(s => s.status === 'executed').length
  const totalSaving = executionHistory.reduce((sum, h) => sum + parseFloat(h.actualSave || '0'), 0)

  return (
    <Spin spinning={loading}>
      <Tabs items={[
        {
          key: 'recommend',
          label: '策略推荐',
          children: (
            <div>
              {/* 统计卡片 */}
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Statistic title="可用策略" value={strategies.length} suffix="条" icon={<RobotOutlined style={{ color: '#1890ff' }} />} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="AI推荐" value={strategies.filter(s => s.type === 'AI推荐').length} suffix="条" valueStyle={{ color: '#1890ff' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="待执行" value={pendingCount} suffix="条" valueStyle={{ color: '#faad14' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="累计节能" value={totalSaving.toFixed(1)} suffix="%" valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
              </Row>

              {/* AI建议卡片 */}
              {recommendations.length > 0 && (
                <Card title="AI实时建议" style={{ marginTop: 16 }} extra={<Tag color="blue"><RobotOutlined /> AI生成</Tag>}>
                  <Row gutter={16}>
                    {recommendations.map((rec, index) => (
                      <Col span={8} key={index}>
                        <Card size="small" type="inner" title={rec.type} hoverable>
                          <p>{rec.suggestion}</p>
                          <Tag color="green">{rec.impact}</Tag>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* 策略列表 */}
              <Card title="策略列表" style={{ marginTop: 16 }}>
                <Table
                  columns={columns}
                  dataSource={strategies}
                  expandable={{
                    expandedRowRender: record => (
                      <p style={{ margin: 0, padding: '8px 0', color: '#666' }}>
                        <strong>详情：</strong>{record.description}
                      </p>
                    )
                  }}
                  pagination={false}
                />
              </Card>
            </div>
          )
        },
        {
          key: 'history',
          label: '执行历史',
          children: (
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Card title="策略执行历史">
                  <Timeline
                    items={executionHistory.map(h => ({
                      color: h.result === '成功' ? 'green' : h.result === '部分成功' ? 'orange' : 'red',
                      children: (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{h.strategyName}</div>
                          <div style={{ color: '#666', fontSize: 12 }}>{h.time}</div>
                          <div style={{ marginTop: 4 }}>
                            结果: <Tag color={h.result === '成功' ? 'green' : 'orange'}>{h.result}</Tag>
                            实际节能: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{h.actualSave}</span>
                          </div>
                        </div>
                      )
                    }))}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="累计节能统计">
                  <ReactECharts option={savingStatsOption} style={{ height: 300 }} />
                </Card>
              </Col>
            </Row>
          )
        },
        {
          key: 'simulation',
          label: '优化仿真',
          icon: <ExperimentOutlined />,
          children: (
            <Row gutter={[16, 16]}>
              <Col span={14}>
                <Card title="能耗优化对比">
                  <ReactECharts option={optimizationOption} style={{ height: 350 }} />
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                    <strong style={{ color: '#52c41a' }}>优化效果：</strong>
                    通过AI策略优化，预计日均节能 <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: 18 }}>15.2%</span>，
                    约 <span style={{ color: '#52c41a', fontWeight: 'bold' }}>1,850 kWh</span>
                  </div>
                </Card>
              </Col>
              <Col span={10}>
                <Card title="策略评估雷达图">
                  <ReactECharts option={radarOption} style={{ height: 350 }} />
                </Card>
              </Col>
            </Row>
          )
        }
      ]} />

      {/* 策略详情弹窗 */}
      <Modal
        title={`策略详情 - ${selectedStrategy?.name}`}
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={selectedStrategy?.status === 'pending' ? [
          <Button key="cancel" onClick={() => setDetailModal(false)}>取消</Button>,
          <Button key="execute" type="primary" icon={<PlayCircleOutlined />} onClick={() => { handleExecute(selectedStrategy!); setDetailModal(false) }}>
            执行策略
          </Button>
        ] : null}
        width={600}
      >
        {selectedStrategy && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="策略名称">{selectedStrategy.name}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={selectedStrategy.type === 'AI推荐' ? 'blue' : 'default'}>{selectedStrategy.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预期节能">{selectedStrategy.expectedSave}</Descriptions.Item>
              <Descriptions.Item label="置信度">{selectedStrategy.confidence}%</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={selectedStrategy.status === 'executed' ? 'green' : 'orange'}>
                  {selectedStrategy.status === 'executed' ? '已执行' : '待执行'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="详细描述" span={2}>{selectedStrategy.description}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
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

export default AIStrategy
