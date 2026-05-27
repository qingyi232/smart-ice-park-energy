import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Modal, Slider, Switch, Descriptions, Progress, Space, message, Spin } from 'antd'
import { SettingOutlined, SyncOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { deviceApi } from '@/services/api'

interface Device {
  key: number
  id: number
  name: string
  type: string
  status: string
  power: number
  efficiency: string
  health: number
  location: string
}

const DeviceManagement = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [controlModal, setControlModal] = useState(false)
  const [inspecting, setInspecting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [devices, setDevices] = useState<Device[]>([])
  const [inspectionReport, setInspectionReport] = useState<any>(null)

  // 获取设备列表
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await deviceApi.getAll() as unknown as any[]
        setDevices(res.map(d => ({ ...d, key: d.id })))
      } catch (error) {
        message.error('获取设备列表失败')
      } finally {
        setLoading(false)
      }
    }
    fetchDevices()
  }, [])

  const columns = [
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'running' ? 'green' : s === 'standby' ? 'orange' : 'red'}>
        {s === 'running' ? '运行中' : s === 'standby' ? '待机' : '故障'}
      </Tag>
    )},
    { title: '功率(kW)', dataIndex: 'power', key: 'power' },
    { title: '能效', dataIndex: 'efficiency', key: 'efficiency', render: (e: string) => (
      <Tag color={e === 'A' ? 'green' : e === 'B' ? 'blue' : 'orange'}>{e}级</Tag>
    )},
    { title: '健康度', dataIndex: 'health', key: 'health', render: (h: number) => (
      <Progress percent={h} size="small" status={h > 90 ? 'success' : h > 70 ? 'normal' : 'exception'} />
    )},
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<SettingOutlined />} onClick={() => { setSelectedDevice(record); setControlModal(true) }}>控制</Button>
      </Space>
    )},
  ]

  const handleInspection = async () => {
    setInspecting(true)
    try {
      const res = await deviceApi.inspection() as any
      setInspectionReport(res.report)
      message.success(`巡检完成！${res.report.warning > 0 ? `发现${res.report.warning}台设备需要关注` : '所有设备运行正常'}`)
    } catch (error) {
      message.error('巡检失败')
    } finally {
      setInspecting(false)
    }
  }

  const handleDeviceControl = async (action: string, value: any) => {
    if (!selectedDevice) return
    try {
      await deviceApi.control(selectedDevice.id, action, value)
      message.success('控制指令已发送')
      // 刷新设备列表
      const res = await deviceApi.getAll() as unknown as any[]
      setDevices(res.map(d => ({ ...d, key: d.id })))
    } catch (error) {
      message.error('控制失败')
    }
  }

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="设备总数" value={devices.length} suffix="台" /></Card></Col>
        <Col span={6}><Card><Statistic title="运行中" value={devices.filter(d => d.status === 'running').length} suffix="台" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="待机" value={devices.filter(d => d.status === 'standby').length} suffix="台" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均健康度" value={devices.length > 0 ? Math.round(devices.reduce((a, b) => a + b.health, 0) / devices.length) : 0} suffix="%" /></Card></Col>
      </Row>

      {/* 巡检报告 */}
      {inspectionReport && (
        <Card title="巡检报告" style={{ marginTop: 16 }} extra={<Button size="small" onClick={() => setInspectionReport(null)}>关闭</Button>}>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic title="检测设备" value={inspectionReport.totalDevices} suffix="台" />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="健康" value={inspectionReport.healthy} suffix="台" valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="需关注" value={inspectionReport.warning} suffix="台" valueStyle={{ color: '#faad14' }} prefix={<WarningOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="异常" value={inspectionReport.critical} suffix="台" valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
          </Row>
          {inspectionReport.recommendations?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong>维护建议：</strong>
              {inspectionReport.recommendations.map((r: any, i: number) => (
                <Tag key={i} color="orange" style={{ marginTop: 8 }}>{r.message}</Tag>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card title="设备列表" style={{ marginTop: 16 }} extra={
        <Button type="primary" icon={<SyncOutlined spin={inspecting} />} loading={inspecting} onClick={handleInspection}>
          一键巡检
        </Button>
      }>
        <Table columns={columns} dataSource={devices} pagination={false} />
      </Card>

      <Modal title={`设备控制 - ${selectedDevice?.name}`} open={controlModal} onCancel={() => setControlModal(false)} footer={null} width={600}>
        {selectedDevice && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="设备类型">{selectedDevice.type}</Descriptions.Item>
              <Descriptions.Item label="位置">{selectedDevice.location}</Descriptions.Item>
              <Descriptions.Item label="当前功率">{selectedDevice.power} kW</Descriptions.Item>
              <Descriptions.Item label="健康度">{selectedDevice.health}%</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="远程控制" style={{ marginTop: 16 }}>
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <span>设备开关：</span>
                  <Switch checkedChildren="开" unCheckedChildren="关" defaultChecked={selectedDevice.status === 'running'} />
                </Col>
                <Col span={16}>
                  <span>功率调节：</span>
                  <Slider defaultValue={selectedDevice.power > 0 ? 80 : 0} marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
                </Col>
              </Row>
              <Button type="primary" style={{ marginTop: 16 }} onClick={() => handleDeviceControl('setPower', 80)}>应用设置</Button>
            </Card>
          </div>
        )}
      </Modal>
    </Spin>
  )
}

const Statistic = ({ title, value, suffix, valueStyle }: any) => (
  <div>
    <div style={{ color: '#666', fontSize: 14 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 'bold', ...valueStyle }}>{value}<span style={{ fontSize: 14, fontWeight: 'normal' }}>{suffix}</span></div>
  </div>
)

export default DeviceManagement
