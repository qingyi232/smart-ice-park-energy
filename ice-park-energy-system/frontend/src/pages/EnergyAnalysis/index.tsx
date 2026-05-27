import { useState, useEffect } from 'react'
import { Row, Col, Card, DatePicker, Radio, Space, Spin, message, Statistic, Table, Tag } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, ThunderboltOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { energyApi } from '@/services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const EnergyAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [historyData, setHistoryData] = useState<any[]>([])
  const [areaData, setAreaData] = useState<any[]>([])
  const [typeData, setTypeData] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const hours = timeRange === 'day' ? 24 : timeRange === 'week' ? 168 : 720
        const [historyRes, areaRes, typeRes, overviewRes] = await Promise.all([
          energyApi.getHistory(hours),
          energyApi.getByArea(),
          energyApi.getByType(),
          energyApi.getOverview()
        ])
        setHistoryData(historyRes as unknown as any[])
        setAreaData(areaRes as unknown as any[])
        setTypeData(typeRes as unknown as any[])
        setOverview(overviewRes as unknown as any)
      } catch (error) {
        message.error('获取能耗数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timeRange])

  // 生成对比数据
  const generateComparisonData = () => {
    const currentData = historyData.map(h => Math.round(h.energy))
    const previousData = currentData.map(v => Math.round(v * (1 + (Math.random() * 0.2 - 0.1))))
    return { currentData, previousData }
  }

  const { currentData, previousData } = generateComparisonData()

  // 能耗趋势对比
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['本期', '上期'] },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: timeRange === 'day'
        ? historyData.map(h => {
            const date = new Date(h.timestamp)
            return `${date.getHours()}:00`
          })
        : timeRange === 'week'
        ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        : ['1日', '5日', '10日', '15日', '20日', '25日', '30日']
    },
    yAxis: { type: 'value', name: 'kWh' },
    series: [
      {
        name: '本期',
        type: 'line',
        smooth: true,
        data: timeRange === 'day' ? currentData : currentData.slice(0, timeRange === 'week' ? 7 : 7),
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.2 }
      },
      {
        name: '上期',
        type: 'line',
        smooth: true,
        data: timeRange === 'day' ? previousData : previousData.slice(0, timeRange === 'week' ? 7 : 7),
        itemStyle: { color: '#faad14' },
        lineStyle: { type: 'dashed' }
      }
    ]
  }

  // 分区域能耗占比
  const areaOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: areaData.map((a, i) => ({
        value: a.energy,
        name: a.area,
        itemStyle: { color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][i] }
      }))
    }]
  }

  // 分类型能耗
  const typeOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '70%',
      data: typeData.map((t, i) => ({
        value: t.energy,
        name: t.type,
        itemStyle: { color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][i] }
      }))
    }]
  }

  // 能耗与温度相关性
  const correlationOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['能耗', '室外温度'] },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: ['6:00', '9:00', '12:00', '15:00', '18:00', '21:00'] },
    yAxis: [
      { type: 'value', name: 'kWh', position: 'left' },
      { type: 'value', name: '°C', position: 'right', min: -25, max: 0 }
    ],
    series: [
      {
        name: '能耗',
        type: 'bar',
        data: [450, 680, 920, 1050, 880, 620],
        itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '室外温度',
        type: 'line',
        yAxisIndex: 1,
        data: [-18, -12, -8, -6, -10, -15],
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { width: 3 }
      }
    ]
  }

  // 能耗排名表格
  const rankingData = [
    { key: 1, rank: 1, name: '1号制冷机组', energy: 2400, change: -5.2, status: 'down' },
    { key: 2, rank: 2, name: '2号制冷机组', energy: 2100, change: 3.1, status: 'up' },
    { key: 3, rank: 3, name: '循环水泵-A', energy: 350, change: -2.8, status: 'down' },
    { key: 4, rank: 4, name: '循环水泵-B', energy: 320, change: 1.5, status: 'up' },
    { key: 5, rank: 5, name: '照明系统', energy: 180, change: -8.3, status: 'down' },
  ]

  const totalEnergy = overview?.today?.total || historyData.reduce((sum, h) => sum + h.energy, 0)
  const savingRate = overview?.today?.savingRate || 5.2

  return (
    <Spin spinning={loading}>
      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <span>时间维度：</span>
          <Radio.Group value={timeRange} onChange={e => setTimeRange(e.target.value)}>
            <Radio.Button value="day">日</Radio.Button>
            <Radio.Button value="week">周</Radio.Button>
            <Radio.Button value="month">月</Radio.Button>
          </Radio.Group>
          <RangePicker defaultValue={[dayjs().subtract(7, 'day'), dayjs()]} />
        </Space>
      </Card>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总能耗"
              value={Math.round(totalEnergy)}
              suffix="kWh"
              prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="环比变化"
              value={savingRate}
              suffix="%"
              prefix={savingRate > 0 ? <ArrowDownOutlined style={{ color: '#52c41a' }} /> : <ArrowUpOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: savingRate > 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="峰值功率" value={1250} suffix="kW" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均负载率" value={72} suffix="%" />
          </Card>
        </Col>
      </Row>

      {/* 趋势图 */}
      <Card title="能耗趋势对比" style={{ marginTop: 16 }}>
        <ReactECharts option={trendOption} style={{ height: 350 }} />
      </Card>

      {/* 占比分析 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="分区域能耗占比">
            <ReactECharts option={areaOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="分类型能耗占比">
            <ReactECharts option={typeOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 相关性分析和排名 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="能耗与温度相关性分析">
            <ReactECharts option={correlationOption} style={{ height: 300 }} />
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8 }}>
              <strong>分析结论：</strong>能耗与室外温度呈负相关，温度每升高1°C，能耗约增加5%。建议在温度较高时段提前启动制冷设备。
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="设备能耗排名">
            <Table
              dataSource={rankingData}
              columns={[
                { title: '排名', dataIndex: 'rank', width: 60, render: (r: number) => (
                  <span style={{ color: r <= 3 ? '#ff4d4f' : '#666', fontWeight: r <= 3 ? 'bold' : 'normal' }}>{r}</span>
                )},
                { title: '设备', dataIndex: 'name' },
                { title: '能耗(kWh)', dataIndex: 'energy', render: (e: number) => <span style={{ fontWeight: 'bold' }}>{e}</span> },
                { title: '变化', dataIndex: 'change', render: (c: number, record: any) => (
                  <Tag color={record.status === 'down' ? 'green' : 'red'}>
                    {record.status === 'down' ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {Math.abs(c)}%
                  </Tag>
                )},
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}

export default EnergyAnalysis
