import { useState, useEffect } from 'react'
import { Tabs, Table, Button, Modal, Form, Input, Select, Switch, Card, Tag, Space, message, Spin, Popconfirm } from 'antd'
import { UserOutlined, SafetyOutlined, SettingOutlined, FileSearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { userApi } from '@/services/api'

interface User {
  key: number
  id: number
  username: string
  name: string
  role: string
  status: string
  lastLogin: string
}

interface Role {
  key: number
  id: number
  name: string
  permissions: string[]
}

const SystemManagement = () => {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [userModal, setUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  // 系统参数
  const [systemParams] = useState([
    { key: 1, name: '数据采集间隔', value: '5', unit: '秒', description: '传感器数据采集频率' },
    { key: 2, name: '预警检测间隔', value: '10', unit: '秒', description: '预警规则检测频率' },
    { key: 3, name: 'AI模型更新周期', value: '24', unit: '小时', description: 'AI预测模型重训练周期' },
    { key: 4, name: '数据保留时间', value: '90', unit: '天', description: '历史数据保留时长' },
    { key: 5, name: '会话超时时间', value: '30', unit: '分钟', description: '用户会话超时时间' },
  ])

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, rolesRes, logsRes] = await Promise.all([
          userApi.getAll(),
          userApi.getRoles(),
          userApi.getLogs()
        ])
        setUsers((usersRes as unknown as any[]).map(u => ({ ...u, key: u.id })))
        setRoles((rolesRes as unknown as any[]).map(r => ({ ...r, key: r.id })))
        setLogs((logsRes as unknown as any[]).map((l, i) => ({ ...l, key: i })))
      } catch (error) {
        message.error('获取数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 打开用户编辑弹窗
  const handleEditUser = (user?: User) => {
    setEditingUser(user || null)
    if (user) {
      form.setFieldsValue(user)
    } else {
      form.resetFields()
    }
    setUserModal(true)
  }

  // 保存用户
  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields()
      if (editingUser) {
        await userApi.update(editingUser.id, values)
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...values } : u))
        message.success('用户更新成功')
      } else {
        const res = await userApi.create(values) as any
        setUsers(prev => [...prev, { ...res.user, key: res.user.id }])
        message.success('用户创建成功')
      }
      setUserModal(false)
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 删除用户
  const handleDeleteUser = async (id: number) => {
    try {
      await userApi.delete(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      message.success('用户已删除')
    } catch (error) {
      message.error('删除失败')
    }
  }

  const userColumns = [
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '角色', dataIndex: 'role', width: 120, render: (r: string) => <Tag color="blue">{r}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => (
      <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag>
    )},
    { title: '最后登录', dataIndex: 'lastLogin', width: 160 },
    { title: '操作', width: 150, render: (_: any, record: User) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>编辑</Button>
        <Popconfirm title="确定删除此用户？" onConfirm={() => handleDeleteUser(record.id)} okText="确定" cancelText="取消">
          <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  const roleColumns = [
    { title: '角色名称', dataIndex: 'name', width: 150 },
    { title: '权限', dataIndex: 'permissions', render: (p: string[]) => (
      <Space wrap>
        {p.map(item => <Tag key={item} color="blue">{item}</Tag>)}
      </Space>
    )},
    { title: '操作', width: 80, render: () => <Button size="small" icon={<EditOutlined />}>编辑</Button> },
  ]

  const logColumns = [
    { title: '时间', dataIndex: 'time', width: 160 },
    { title: '用户', dataIndex: 'user', width: 100 },
    { title: '操作', dataIndex: 'action' },
    { title: 'IP地址', dataIndex: 'ip', width: 130 },
    { title: '结果', dataIndex: 'result', width: 80, render: (r: string) => (
      <Tag color={r === '成功' ? 'green' : 'red'}>{r}</Tag>
    )},
  ]

  const paramColumns = [
    { title: '参数名称', dataIndex: 'name', width: 150 },
    { title: '当前值', dataIndex: 'value', width: 120, render: (v: string, r: any) => (
      <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{v} {r.unit}</span>
    )},
    { title: '说明', dataIndex: 'description' },
    { title: '操作', width: 80, render: () => <Button size="small" icon={<EditOutlined />}>修改</Button> },
  ]

  return (
    <Spin spinning={loading}>
      <Tabs items={[
        {
          key: 'users',
          label: '用户管理',
          icon: <UserOutlined />,
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleEditUser()}>新增用户</Button>}>
              <Table columns={userColumns} dataSource={users} pagination={{ pageSize: 10 }} />
            </Card>
          )
        },
        {
          key: 'roles',
          label: '角色权限',
          icon: <SafetyOutlined />,
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />}>新增角色</Button>}>
              <Table columns={roleColumns} dataSource={roles} pagination={false} />
              
              <Card title="权限说明" size="small" style={{ marginTop: 16 }}>
                <Table
                  dataSource={[
                    { key: 1, permission: '全部权限', description: '拥有系统所有功能的访问和操作权限' },
                    { key: 2, permission: '设备管理', description: '可以查看、控制设备，执行巡检' },
                    { key: 3, permission: '监控查看', description: '可以查看各类监控数据和报表' },
                    { key: 4, permission: '预警处理', description: '可以查看和处理系统预警' },
                  ]}
                  columns={[
                    { title: '权限', dataIndex: 'permission', width: 150 },
                    { title: '说明', dataIndex: 'description' },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Card>
          )
        },
        {
          key: 'params',
          label: '系统参数',
          icon: <SettingOutlined />,
          children: (
            <Card>
              <Table columns={paramColumns} dataSource={systemParams} pagination={false} />
              
              <Card title="系统信息" size="small" style={{ marginTop: 16 }}>
                <p><strong>系统版本：</strong>v1.0.0</p>
                <p><strong>运行时间：</strong>15天 8小时 32分钟</p>
                <p><strong>数据库状态：</strong><Tag color="green">正常</Tag></p>
                <p><strong>缓存状态：</strong><Tag color="green">正常</Tag></p>
                <p><strong>AI服务状态：</strong><Tag color="green">正常</Tag></p>
              </Card>
            </Card>
          )
        },
        {
          key: 'logs',
          label: '操作日志',
          icon: <FileSearchOutlined />,
          children: (
            <Card>
              <Table columns={logColumns} dataSource={logs} pagination={{ pageSize: 15 }} />
            </Card>
          )
        }
      ]} />

      {/* 用户编辑弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={userModal}
        onCancel={() => setUserModal(false)}
        onOk={handleSaveUser}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色" options={roles.map(r => ({ value: r.name, label: r.name }))} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  )
}

export default SystemManagement
