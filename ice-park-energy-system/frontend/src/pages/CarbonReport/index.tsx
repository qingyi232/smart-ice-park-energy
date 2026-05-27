import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, DatePicker, Button, Tabs, Select, Space, Spin, message, Statistic } from 'antd'
import { DownloadOutlined, FileTextOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { energyApi, carbonApi } from '@/services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const CarbonReport = () => {
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('daily')
  const [energyData, setEnergyData] = useState<any[]>([])
  const [carbonData, setCarbonData] = useState<any[]>([])
  const [carbonReport, setCarbonReport] = useState<any>(null)

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [historyRes, reportRes] = await Promise.all([
          energyApi.getHistory(reportType === 'daily' ? 24 : reportType === 'weekly' ? 168 : 720),
          carbonApi.getReport(reportType)
        ])
        
        // 处理能耗数据
        const history = historyRes as unknown as any[]
        const grouped = groupDataByPeriod(history, reportType)
        setEnergyData(grouped)
        
        // 处理碳排放数据
        setCarbonReport(reportRes as unknown as any)
        setCarbonData(grouped.map(d => ({
          ...d,
          emission: (d.totalEnergy * 0.0006).toFixed(2),
          reduction: (d.totalEnergy * 0.0001).toFixed(2),
          netEmission: (d.totalEnergy * 0.0005).toFixed(2)
        })))
      } catch (error) {
        message.error('获取报表数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [reportType])

  // 按周期分组数据
  const groupDataByPeriod = (data: any[], type: string) => {
    if (type === 'daily') {
      return data.slice(-7).map((d, i) => ({
        key: i,
        date: dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'),
        totalEnergy: Math.round(d.energy * 24),
        cooling: Math.round(d.energy * 24 * 0.56),
        lighting: Math.round(d.energy * 24 * 0.18),
        circulation: Math.round(d.energy * 24 * 0.15),
        other: Math.round(d.energy * 24 * 0.11),
        cost: Math.round(d.energy * 24 * 0.5)
      }))
    }
    return data.slice(-7).map((d, i) => ({
      key: i,
      date: `第${i + 1}${type === 'weekly' ? '周' : '月'}`,
      totalEnergy: Math.round(d.energy * (type === 'weekly' ? 168 : 720)),
      cooling: Math.round(d.energy * (type === 'weekly' ? 168 : 720) * 0.56),
      lighting: Math.round(d.energy * (type === 'weekly' ? 168 : 720) * 0.18),
      circulation: Math.round(d.energy * (type === 'weekly' ? 168 : 720) * 0.15),
      other: Math.round(d.energy * (type === 'weekly' ? 168 : 720) * 0.11),
      cost: Math.round(d.energy * (type === 'weekly' ? 168 : 720) * 0.5)
    }))
  }

  // 导出报表
  const handleExport = () => {
    message.success('报表导出中...')
    // 实际项目中这里会调用后端API生成Excel/PDF
    setTimeout(() => message.success('报表已导出'), 1500)
  }

  // 能耗趋势图
  const energyTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['制冷', '照明', '循环', '其他'] },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: energyData.map(d => d.date) },
    yAxis: { type: 'value', name: 'kWh' },
    series: [
      { name: '制冷', type: 'bar', stack: 'total', data: energyData.map(d => d.cooling), itemStyle: { color: '#1890ff' } },
      { name: '照明', type: 'bar', stack: 'total', data: energyData.map(d => d.lighting), itemStyle: { color: '#52c41a' } },
      { name: '循环', type: 'bar', stack: 'total', data: energyData.map(d => d.circulation), itemStyle: { color: '#faad14' } },
      { name: '其他', type: 'bar', stack: 'total', data: energyData.map(d => d.other), itemStyle: { color: '#722ed1' } },
    ]
  }

  // 碳排放趋势图
  const carbonTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['碳排放', '碳减排', '净排放'] },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: carbonData.map(d => d.date) },
    yAxis: { type: 'value', name: '吨CO₂' },
    series: [
      { name: '碳排放', type: 'bar', data: carbonData.map(d => parseFloat(d.emission)), itemStyle: { color: '#ff4d4f' } },
      { name: '碳减排', type: 'bar', data: carbonData.map(d => parseFloat(d.reduction)), itemStyle: { color: '#52c41a' } },
      { name: '净排放', type: 'line', data: carbonData.map(d => parseFloat(d.netEmission)), itemStyle: { color: '#1890ff' }, lineStyle: { width: 3 } },
    ]
  }

  // 碳排放构成饼图
  const carbonPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}吨 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: carbonReport?.breakdown?.map((b: any, i: number) => ({
        value: b.emission,
        name: b.source,
        itemStyle: { color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][i] }
      })) || [
        { value: 32, name: '制冷系统', itemStyle: { color: '#1890ff' } },
        { value: 8, name: '照明系统', itemStyle: { color: '#52c41a' } },
        { value: 6, name: '循环系统', itemStyle: { color: '#faad14' } },
        { value: 4, name: '其他', itemStyle: { color: '#722ed1' } },
      ]
    }]
  }

  const energyColumns = [
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '总能耗(kWh)', dataIndex: 'totalEnergy', render: (v: number) => <span style={{ fontWeight: 'bold' }}>{v.toLocaleString()}</span> },
    { title: '制冷(kWh)', dataIndex: 'cooling' },
    { title: '照明(kWh)', dataIndex: 'lighting' },
    { title: '循环(kWh)', dataIndex: 'circulation' },
    { title: '其他(kWh)', dataIndex: 'other' },
    { title: '费用(元)', dataIndex: 'cost', render: (v: number) => <span style={{ color: '#ff4d4f' }}>¥{v.toLocaleString()}</span> },
  ]

  const carbonColumns = [
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '碳排放(吨)', dataIndex: 'emission', render: (v: string) => <span style={{ color: '#ff4d4f' }}>{v}</span> },
    { title: '碳减排(吨)', dataIndex: 'reduction', render: (v: string) => <span style={{ color: '#52c41a' }}>-{v}</span> },
    { title: '净排放(吨)', dataIndex: 'netEmission', render: (v: string) => <span style={{ fontWeight: 'bold' }}>{v}</span> },
  ]

  const totalEnergy = energyData.reduce((sum, d) => sum + d.totalEnergy, 0)
  const totalCost = energyData.reduce((sum, d) => sum + d.cost, 0)
  const totalEmission = carbonData.reduce((sum, d) => sum + parseFloat(d.emission || '0'), 0)
  const totalReduction = carbonData.reduce((sum, d) => sum + parseFloat(d.reduction || '0'), 0)

  return (
    <Spin spinning={loading}>
      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <span>报表类型：</span>
          <Select value={reportType} style={{ width: 100 }} onChange={setReportType} options={[
            { value: 'daily', label: '日报' },
            { value: 'weekly', label: '周报' },
            { value: 'monthly', label: '月报' },
          ]} />
          <RangePicker defaultValue={[dayjs().subtract(7, 'day'), dayjs()]} />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>导出报表</Button>
        </Space>
      </Card>

      <Tabs items={[
        {
          key: 'energy',
          label: '能源消耗报表',
          icon: <FileTextOutlined />,
          children: (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Statistic title="总能耗" value={totalEnergy.toLocaleString()} suffix="kWh" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="日均能耗" value={Math.round(totalEnergy / energyData.length).toLocaleString()} suffix="kWh" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="环比变化" value="-5.2" suffix="%" valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="总费用" value={totalCost.toLocaleString()} prefix="¥" valueStyle={{ color: '#ff4d4f' }} />
                  </Card>
                </Col>
              </Row>
              <Card title="能耗趋势" style={{ marginTop: 16 }} extra={<BarChartOutlined />}>
                <ReactECharts option={energyTrendOption} style={{ height: 350 }} />
              </Card>
              <Card title="能耗明细" style={{ marginTop: 16 }}>
                <Table columns={energyColumns} dataSource={energyData} pagination={false} size="small" />
              </Card>
            </div>
          )
        },
        {
          key: 'carbon',
          label: '碳排放报表',
          icon: <PieChartOutlined />,
          children: (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Statistic title="总碳排放" value={totalEmission.toFixed(1)} suffix="吨" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="碳减排量" value={totalReduction.toFixed(1)} suffix="吨" valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="净排放量" value={(totalEmission - totalReduction).toFixed(1)} suffix="吨" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="减排率" value={((totalReduction / totalEmission) * 100).toFixed(1)} suffix="%" valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
              </Row>
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={14}>
                  <Card title="碳排放趋势">
                    <ReactECharts option={carbonTrendOption} style={{ height: 350 }} />
                  </Card>
                </Col>
                <Col span={10}>
                  <Card title="碳排放构成">
                    <ReactECharts option={carbonPieOption} style={{ height: 350 }} />
                  </Card>
                </Col>
              </Row>
              <Card title="碳排放明细" style={{ marginTop: 16 }}>
                <Table columns={carbonColumns} dataSource={carbonData} pagination={false} size="small" />
              </Card>
            </div>
          )
        }
      ]} />
    </Spin>
  )
}

const Statistic = ({ title, value, suffix, prefix, valueStyle }: any) => (
  <div>
    <div style={{ color: '#666', fontSize: 14 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 'bold', ...valueStyle }}>
      {prefix}{value}<span style={{ fontSize: 14, fontWeight: 'normal' }}>{suffix}</span>
    </div>
  </div>
)

export default CarbonReport
