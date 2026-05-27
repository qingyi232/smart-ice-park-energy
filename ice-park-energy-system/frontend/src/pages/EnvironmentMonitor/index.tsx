import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Modal, Form, InputNumber, Space, message, Spin, Badge } from 'antd'
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { environmentApi } from '@/services/api'
import socketService from '@/services/socket'

interface EnvParam {
  key: string
  name: string
  value: number
  unit: string
  min: number
  max: number
  status: string
}

const EnvironmentMonitor = () => {
  const [loading, setLoading] = useState(true)
  const [thresholdModal, setThresholdModal] = useState(false)
  const [envData, setEnvData] = useState<EnvParam[]>([])
  const [historyData, setHistoryData] = useState<any[]>([])
  const [thresholds, setThresholds] = useState<any>({})
  const [form] = Form.useForm()

  // 获取环境数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentRes, historyRes, thresholdsRes] = await Promise.all([
          environmentApi.getCurrent(),
          environmentApi.getHistory(24),
          environmentApi.getThresholds()
        ])
        
        const current = currentRes as unknown as any
        setEnvData([
          { key: 'temp', name: '温度', value: current.temperature.value, unit: '°C', min: current.temperature.min, max: current.temperature.max, status: current.temperature.status },
          { key: 'humidity', name: '湿度', value: current.humidity.value, unit: '%', min: current.humidity.min, max: current.humidity.max, status: current.humidity.status },
          { key: 'wind', name: '风速', value: current.windSpeed.value, unit: 'm/s', min: current.windSpeed.min, max: current.windSpeed.max, status: current.windSpeed.status },
          { key: 'uv', name: '紫外线', value: current.uv.value, unit: 'mW/cm²', min: current.uv.min, max: current.uv.max, status: current.uv.status },
          { key: 'co2', name: 'CO2', value: current.co2.value, unit: 'ppm', min: current.co2.min, max: current.co2.max, status: current.co2.status },
        ])
        setHistoryData(historyRes as unknown as any[])
        setThresholds(thresholdsRes as unknown as any)
      } catch (error) {
        message.error('获取环境数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // WebSocket实时更新
  useEffect(() => {
    socketService.connect()
    socketService.onEnvironmentData((data) => {
      setEnvData(prev => prev.map(item => {
        if (item.key === 'temp') return { ...item, value: parseFloat(data.temperature.toFixed(1)) }
        if (item.key === 'humidity') return { ...item, value: parseFloat(data.humidity.toFixed(0)) }
        if (item.key === 'wind') return { ...item, value: parseFloat(data.windSpeed.toFixed(1)) }
        if (item.key === 'uv') return { ...item, value: parseFloat(data.uv.toFixed(1)) }
        if (item.key === 'co2') return { ...item, value: parseFloat(data.co2.toFixed(0)) }
        return item
      }))
    })
    return () => socketService.off('environment:realtime')
  }, [])

  // 保存阈值
  const handleSaveThresholds = async () => {
    try {
      const values = await form.validateFields()
      await environmentApi.updateThresholds(values)
      setThresholds(values)
      message.success('阈值设置已保存')
      setThresholdModal(false)
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 仪表盘配置
  const gaugeOption = (item: EnvParam) => ({
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: item.min,
      max: item.max,
      splitNumber: 5,
      itemStyle: { color: getGaugeColor(item) },
      progress: { show: true, width: 20 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 20, color: [[1, '#e6ebf8']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: true, offsetCenter: [0, '70%'], fontSize: 14, color: '#666' },
      detail: {
        valueAnimation: true,
        fontSize: 28,
        fontWeight: 'bold',
        offsetCenter: [0, '0%'],
        formatter: `{value}${item.unit}`,
        color: getGaugeColor(item)
      },
      data: [{ value: item.value, name: item.name }]
    }]
  })

  // 获取仪表盘颜色
  const getGaugeColor = (item: EnvParam) => {
    const ratio = (item.value - item.min) / (item.max - item.min)
    if (item.key === 'temp') {
      return ratio > 0.8 ? '#ff4d4f' : ratio > 0.6 ? '#faad14' : '#52c41a'
    }
    return ratio > 0.8 ? '#ff4d4f' : ratio > 0.6 ? '#faad14' : '#1890ff'
  }

  // 历史趋势图
  const historyOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度', '湿度'] },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: historyData.map(h => {
        const date = new Date(h.timestamp)
        return `${date.getHours()}:00`
      })
    },
    yAxis: [
      { type: 'value', name: '°C', position: 'left', min: -25, max: 0 },
      { type: 'value', name: '%', position: 'right', min: 40, max: 80 }
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        smooth: true,
        data: historyData.map(h => h.temperature?.toFixed(1) || -15),
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.2 }
      },
      {
        name: '湿度',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: historyData.map(h => h.humidity?.toFixed(0) || 60),
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  // 多参数趋势图
  const multiParamOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['风速', '紫外线', 'CO2'] },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: historyData.slice(-12).map(h => {
        const date = new Date(h.timestamp)
        return `${date.getHours()}:00`
      })
    },
    yAxis: [
      { type: 'value', name: 'm/s', position: 'left' },
      { type: 'value', name: 'ppm', position: 'right' }
    ],
    series: [
      { name: '风速', type: 'bar', data: historyData.slice(-12).map(h => h.windSpeed?.toFixed(1) || 2), itemStyle: { color: '#722ed1' } },
      { name: '紫外线', type: 'line', data: historyData.slice(-12).map(h => h.uv?.toFixed(1) || 1), itemStyle: { color: '#eb2f96' } },
      { name: 'CO2', type: 'line', yAxisIndex: 1, data: historyData.slice(-12).map(h => h.co2?.toFixed(0) || 420), itemStyle: { color: '#13c2c2' } }
    ]
  }

  // 预警记录
  const alertRecords = [
    { key: 1, time: '2024-01-15 14:32', param: '温度', value: '-8°C', threshold: '-10°C', status: '已处理' },
    { key: 2, time: '2024-01-14 09:15', param: '湿度', value: '75%', threshold: '70%', status: '已处理' },
    { key: 3, time: '2024-01-13 22:48', param: 'CO2', value: '850ppm', threshold: '800ppm', status: '已处理' },
  ]

  return (
    <Spin spinning={loading}>
      {/* 实时参数仪表盘 */}
      <Row gutter={[16, 16]}>
        {envData.map(item => (
          <Col xs={12} sm={8} lg={4} key={item.key}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Badge status={item.status === 'normal' ? 'success' : 'warning'} />
              <ReactECharts option={gaugeOption(item)} style={{ height: 160 }} />
            </Card>
          </Col>
        ))}
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Button type="primary" icon={<SettingOutlined />} onClick={() => { setThresholdModal(true); form.setFieldsValue(thresholds) }}>
              阈值设置
            </Button>
            <Badge status="processing" text="实时更新中" />
          </Card>
        </Col>
      </Row>

      {/* 历史趋势 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="温湿度历史趋势（24小时）" extra={<ReloadOutlined style={{ cursor: 'pointer' }} />}>
            <ReactECharts option={historyOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="其他参数趋势（12小时）">
            <ReactECharts option={multiParamOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 预警记录 */}
      <Card title="环境预警记录" style={{ marginTop: 16 }}>
        <Table
          dataSource={alertRecords}
          columns={[
            { title: '时间', dataIndex: 'time', width: 160 },
            { title: '参数', dataIndex: 'param', width: 80 },
            { title: '触发值', dataIndex: 'value', width: 100, render: (v: string) => <span style={{ color: '#ff4d4f' }}>{v}</span> },
            { title: '阈值', dataIndex: 'threshold', width: 100 },
            { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color="green">{s}</Tag> },
          ]}
          pagination={false}
          size="small"
        />
      </Card>

      {/* 阈值设置弹窗 */}
      <Modal
        title="环境参数阈值设置"
        open={thresholdModal}
        onCancel={() => setThresholdModal(false)}
        onOk={handleSaveThresholds}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="温度 (°C)">
            <Space>
              <Form.Item name={['temperature', 'min']} noStyle><InputNumber placeholder="最小值" /></Form.Item>
              <span>~</span>
              <Form.Item name={['temperature', 'max']} noStyle><InputNumber placeholder="最大值" /></Form.Item>
            </Space>
          </Form.Item>
          <Form.Item label="湿度 (%)">
            <Space>
              <Form.Item name={['humidity', 'min']} noStyle><InputNumber placeholder="最小值" /></Form.Item>
              <span>~</span>
              <Form.Item name={['humidity', 'max']} noStyle><InputNumber placeholder="最大值" /></Form.Item>
            </Space>
          </Form.Item>
          <Form.Item label="风速 (m/s)">
            <Space>
              <Form.Item name={['windSpeed', 'min']} noStyle><InputNumber placeholder="最小值" /></Form.Item>
              <span>~</span>
              <Form.Item name={['windSpeed', 'max']} noStyle><InputNumber placeholder="最大值" /></Form.Item>
            </Space>
          </Form.Item>
          <Form.Item label="CO2 (ppm)">
            <Space>
              <Form.Item name={['co2', 'min']} noStyle><InputNumber placeholder="最小值" /></Form.Item>
              <span>~</span>
              <Form.Item name={['co2', 'max']} noStyle><InputNumber placeholder="最大值" /></Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  )
}

export default EnvironmentMonitor
