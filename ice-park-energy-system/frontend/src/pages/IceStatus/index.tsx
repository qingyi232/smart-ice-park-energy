import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Progress, Modal, Spin, message, Descriptions, Timeline } from 'antd'
import { EyeOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { iceApi } from '@/services/api'
import socketService from '@/services/socket'

interface IceData {
  key: number
  id: number
  name: string
  volume: number
  health: string
  remainLife: number
  mainFactor: string
  area: string
}

const IceStatus = () => {
  const [loading, setLoading] = useState(true)
  const [iceData, setIceData] = useState<IceData[]>([])
  const [selectedIce, setSelectedIce] = useState<IceData | null>(null)
  const [detailModal, setDetailModal] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [predictionData, setPredictionData] = useState<any[]>([])
  const [factors, setFactors] = useState<any[]>([])

  // 获取冰建数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [iceRes, factorsRes] = await Promise.all([
          iceApi.getAll(),
          iceApi.getFactors()
        ])
        setIceData((iceRes as unknown as any[]).map(i => ({ ...i, key: i.id })))
        setFactors(factorsRes as unknown as any[])
      } catch (error) {
        message.error('获取冰建数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // WebSocket实时更新
  useEffect(() => {
    socketService.connect()
    socketService.onIceData((data) => {
      if (data.sculptures) {
        setIceData(prev => prev.map(ice => {
          const updated = data.sculptures.find((s: any) => s.id === ice.id)
          return updated ? { ...ice, volume: updated.volume.toFixed(1), health: updated.health } : ice
        }))
      }
    })
    return () => socketService.off('ice:realtime')
  }, [])

  // 查看详情
  const handleViewDetail = async (record: IceData) => {
    setSelectedIce(record)
    setDetailModal(true)
    try {
      const [historyRes, predictionRes] = await Promise.all([
        iceApi.getHistory(record.id, 7),
        iceApi.getPrediction(record.id, 72)
      ])
      setHistoryData(historyRes as unknown as any[])
      setPredictionData(predictionRes as unknown as any[])
    } catch (error) {
      message.error('获取详情失败')
    }
  }

  // 体积趋势图
  const volumeTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: iceData.slice(0, 4).map(i => i.name.split('-')[0]) },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: ['7天前', '6天前', '5天前', '4天前', '3天前', '2天前', '1天前', '今天'] },
    yAxis: { type: 'value', name: '体积%', max: 100, min: 50 },
    series: iceData.slice(0, 4).map((ice, index) => ({
      name: ice.name.split('-')[0],
      type: 'line',
      smooth: true,
      data: Array.from({ length: 8 }, (_, i) => Math.min(100, ice.volume + (7 - i) * 2 + Math.random() * 2)),
      itemStyle: { color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][index] }
    }))
  }

  // 影响因素图
  const factorOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: factors.length > 0 ? factors.map(f => ({
        value: f.impact,
        name: f.factor,
        itemStyle: { color: f.factor === '环境温度' ? '#ff4d4f' : f.factor === '人流摩擦' ? '#faad14' : f.factor === '空气湿度' ? '#1890ff' : f.factor === '紫外线' ? '#722ed1' : '#52c41a' }
      })) : [
        { value: 45, name: '环境温度', itemStyle: { color: '#ff4d4f' } },
        { value: 25, name: '人流摩擦', itemStyle: { color: '#faad14' } },
        { value: 15, name: '空气湿度', itemStyle: { color: '#1890ff' } },
        { value: 10, name: '紫外线', itemStyle: { color: '#722ed1' } },
        { value: 5, name: '其他', itemStyle: { color: '#52c41a' } },
      ]
    }]
  }

  // 详情预测图
  const detailPredictionOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: predictionData.map(p => `${p.hour}h`) },
    yAxis: { type: 'value', name: '体积%', max: 100, min: 0 },
    series: [{
      type: 'line',
      data: predictionData.map(p => p.volume),
      smooth: true,
      areaStyle: { opacity: 0.3, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ff4d4f' }, { offset: 1, color: 'rgba(255,77,79,0.1)' }] } },
      itemStyle: { color: '#ff4d4f' },
      markLine: {
        data: [{ yAxis: 60, name: '警戒线', lineStyle: { color: '#faad14', type: 'dashed' } }]
      }
    }]
  }

  const columns = [
    { title: '冰建名称', dataIndex: 'name', key: 'name', render: (name: string, record: IceData) => (
      <a onClick={() => handleViewDetail(record)}>{name}</a>
    )},
    { title: '区域', dataIndex: 'area', key: 'area', width: 80 },
    { title: '当前体积', dataIndex: 'volume', key: 'volume', width: 150, render: (v: number) => (
      <Progress percent={v} size="small" status={v > 80 ? 'success' : v > 60 ? 'normal' : 'exception'} format={p => `${p}%`} />
    )},
    { title: '健康状态', dataIndex: 'health', key: 'health', width: 100, render: (h: string) => (
      <Tag icon={h === 'good' ? <CheckCircleOutlined /> : h === 'warning' ? <WarningOutlined /> : <CloseCircleOutlined />} color={h === 'good' ? 'success' : h === 'warning' ? 'warning' : 'error'}>
        {h === 'good' ? '良好' : h === 'warning' ? '注意' : '危险'}
      </Tag>
    )},
    { title: '预计剩余寿命', dataIndex: 'remainLife', key: 'remainLife', width: 120, render: (l: number) => (
      <span style={{ color: l > 60 ? '#52c41a' : l > 40 ? '#faad14' : '#ff4d4f', fontWeight: 'bold' }}>{l}小时</span>
    )},
    { title: '主要影响因素', dataIndex: 'mainFactor', key: 'mainFactor' },
    { title: '操作', key: 'action', width: 80, render: (_: any, record: IceData) => (
      <a onClick={() => handleViewDetail(record)}><EyeOutlined /> 详情</a>
    )},
  ]

  const goodCount = iceData.filter(i => i.health === 'good').length
  const warningCount = iceData.filter(i => i.health === 'warning').length
  const dangerCount = iceData.filter(i => i.health === 'danger').length

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="冰建总数" value={iceData.length} suffix="座" icon="❄️" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="良好状态" value={goodCount} suffix="座" valueStyle={{ color: '#52c41a' }} icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="需关注" value={warningCount} suffix="座" valueStyle={{ color: '#faad14' }} icon={<WarningOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="危险状态" value={dangerCount} suffix="座" valueStyle={{ color: '#ff4d4f' }} icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="冰建状态列表" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={iceData} pagination={false} />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="体积变化趋势（近7天）">
            <ReactECharts option={volumeTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="融化影响因素分析">
            <ReactECharts option={factorOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 详情弹窗 */}
      <Modal
        title={`冰建详情 - ${selectedIce?.name}`}
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={800}
      >
        {selectedIce && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="名称">{selectedIce.name}</Descriptions.Item>
              <Descriptions.Item label="区域">{selectedIce.area}</Descriptions.Item>
              <Descriptions.Item label="当前体积">{selectedIce.volume}%</Descriptions.Item>
              <Descriptions.Item label="健康状态">
                <Tag color={selectedIce.health === 'good' ? 'green' : selectedIce.health === 'warning' ? 'orange' : 'red'}>
                  {selectedIce.health === 'good' ? '良好' : selectedIce.health === 'warning' ? '注意' : '危险'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预计剩余寿命">{selectedIce.remainLife}小时</Descriptions.Item>
              <Descriptions.Item label="主要影响因素">{selectedIce.mainFactor}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="融化预测（未来72小时）" style={{ marginTop: 16 }}>
              <ReactECharts option={detailPredictionOption} style={{ height: 250 }} />
            </Card>

            <Card size="small" title="维护建议" style={{ marginTop: 16 }}>
              <Timeline items={[
                { color: selectedIce.health === 'danger' ? 'red' : 'blue', children: selectedIce.health === 'danger' ? '紧急：建议立即增加制冷功率' : '当前状态稳定' },
                { color: 'green', children: '建议每4小时检查一次表面状态' },
                { color: 'gray', children: '预计下次大规模维护时间：48小时后' },
              ]} />
            </Card>
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

export default IceStatus
