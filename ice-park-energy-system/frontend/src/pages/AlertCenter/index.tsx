import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, Badge, message, Spin } from 'antd'
import { BellOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons'
import { alertApi } from '@/services/api'
import socketService from '@/services/socket'
import { useAppStore } from '@/store'

interface Alert {
  key: number
  id: number
  time: string
  level: string
  type: string
  content: string
  status: string
}

interface Rule {
  key: number
  id: number
  name: string
  param: string
  condition: string
  level: string
  enabled: boolean
}

const AlertCenter = () => {
  const [ruleModal, setRuleModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [levelFilter, setLevelFilter] = useState('all')
  const setPendingAlerts = useAppStore(state => state.setPendingAlerts)
  const [form] = Form.useForm()

  // 获取预警数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, rulesRes] = await Promise.all([
          alertApi.getAll({ level: levelFilter !== 'all' ? levelFilter : undefined }),
          alertApi.getRules()
        ])
        const alertsList = (alertsRes as unknown as any[]).map(a => ({ ...a, key: a.id }))
        setAlerts(alertsList)
        setRules((rulesRes as unknown as any[]).map(r => ({ ...r, key: r.id })))
        setPendingAlerts(alertsList.filter(a => a.status === 'pending').length)
      } catch (error) {
        message.error('获取预警数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [levelFilter, setPendingAlerts])

  // WebSocket实时预警
  useEffect(() => {
    socketService.connect()
    socketService.onAlert((data) => {
      setAlerts(prev => [{ ...data, key: data.id }, ...prev])
      message.warning(`新预警: ${data.content}`)
    })
    return () => socketService.off('alert:new')
  }, [])

  // 处理预警
  const handleResolve = async (id: number) => {
    try {
      await alertApi.resolve(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a))
      message.success('预警已处理')
    } catch (error) {
      message.error('处理失败')
    }
  }

  // 创建规则
  const handleCreateRule = async () => {
    try {
      const values = await form.validateFields()
      await alertApi.createRule(values)
      message.success('规则创建成功')
      setRuleModal(false)
      form.resetFields()
      // 刷新规则列表
      const rulesRes = await alertApi.getRules()
      setRules((rulesRes as unknown as any[]).map(r => ({ ...r, key: r.id })))
    } catch (error) {
      message.error('创建失败')
    }
  }

  const alertColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '级别', dataIndex: 'level', key: 'level', width: 80, render: (l: string) => {
      const colors: Record<string, string> = { error: 'red', warning: 'orange', info: 'blue', success: 'green' }
      const labels: Record<string, string> = { error: '紧急', warning: '警告', info: '提示', success: '成功' }
      return <Tag color={colors[l]}>{labels[l]}</Tag>
    }},
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '内容', dataIndex: 'content', key: 'content' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
      <Tag color={s === 'pending' ? 'orange' : 'green'}>{s === 'pending' ? '待处理' : '已处理'}</Tag>
    )},
    { title: '操作', key: 'action', width: 100, render: (_: any, record: Alert) => (
      record.status === 'pending' ? <Button size="small" icon={<CheckOutlined />} onClick={() => handleResolve(record.id)}>处理</Button> : '-'
    )},
  ]

  const ruleColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '监测参数', dataIndex: 'param', key: 'param' },
    { title: '触发条件', dataIndex: 'condition', key: 'condition' },
    { title: '预警级别', dataIndex: 'level', key: 'level', render: (l: string) => {
      const colors: Record<string, string> = { error: 'red', warning: 'orange', info: 'blue' }
      return <Tag color={colors[l]}>{l === 'error' ? '紧急' : l === 'warning' ? '警告' : '提示'}</Tag>
    }},
    { title: '状态', dataIndex: 'enabled', key: 'enabled', render: (e: boolean) => (
      <Badge status={e ? 'success' : 'default'} text={e ? '启用' : '禁用'} />
    )},
    { title: '操作', key: 'action', render: () => <Button size="small">编辑</Button> },
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="今日预警" value={alerts.length} prefix={<BellOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="待处理" value={alerts.filter(a => a.status === 'pending').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="紧急预警" value={alerts.filter(a => a.level === 'error').length} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已处理" value={alerts.filter(a => a.status === 'resolved').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card title="实时预警" style={{ marginTop: 16 }} extra={
        <Space>
          <Select value={levelFilter} style={{ width: 120 }} onChange={setLevelFilter} options={[
            { value: 'all', label: '全部级别' },
            { value: 'error', label: '紧急' },
            { value: 'warning', label: '警告' },
            { value: 'info', label: '提示' },
          ]} />
        </Space>
      }>
        <Spin spinning={loading}>
          <Table columns={alertColumns} dataSource={alerts} pagination={{ pageSize: 10 }} />
        </Spin>
      </Card>

      <Card title="预警规则管理" style={{ marginTop: 16 }} extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setRuleModal(true)}>新增规则</Button>
      }>
        <Table columns={ruleColumns} dataSource={rules} pagination={false} />
      </Card>

      <Modal title="新增预警规则" open={ruleModal} onCancel={() => { setRuleModal(false); form.resetFields() }} onOk={handleCreateRule}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="param" label="监测参数" rules={[{ required: true, message: '请选择参数' }]}>
            <Select placeholder="选择参数" options={[
              { value: '温度', label: '温度' },
              { value: '湿度', label: '湿度' },
              { value: '功率', label: '功率' },
              { value: 'CO2', label: 'CO2' },
            ]} />
          </Form.Item>
          <Form.Item name="condition" label="触发条件" rules={[{ required: true, message: '请输入条件' }]}>
            <Input placeholder="如: > -10°C 或 < 60%" />
          </Form.Item>
          <Form.Item name="level" label="预警级别" rules={[{ required: true, message: '请选择级别' }]}>
            <Select options={[
              { value: 'error', label: '紧急' },
              { value: 'warning', label: '警告' },
              { value: 'info', label: '提示' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

const Statistic = ({ title, value, prefix, valueStyle }: any) => (
  <div>
    <div style={{ color: '#666', fontSize: 14 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 'bold', ...valueStyle }}>{prefix} {value}</div>
  </div>
)

export default AlertCenter
