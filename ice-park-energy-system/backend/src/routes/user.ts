import { Router } from 'express'

const router = Router()

const users = [
  { id: 1, username: 'admin', name: '系统管理员', role: '超级管理员', status: 'active', lastLogin: '2024-01-15 15:30:00' },
  { id: 2, username: 'operator1', name: '张三', role: '运维人员', status: 'active', lastLogin: '2024-01-15 14:20:00' },
  { id: 3, username: 'operator2', name: '李四', role: '运维人员', status: 'active', lastLogin: '2024-01-15 10:15:00' },
  { id: 4, username: 'viewer1', name: '王五', role: '访客', status: 'inactive', lastLogin: '2024-01-10 09:00:00' },
]

const roles = [
  { id: 1, name: '超级管理员', permissions: ['全部权限'] },
  { id: 2, name: '运维人员', permissions: ['设备管理', '监控查看', '预警处理'] },
  { id: 3, name: '访客', permissions: ['监控查看'] },
]

const logs = [
  { id: 1, time: '2024-01-15 15:32:18', user: 'admin', action: '登录系统', ip: '192.168.1.100', result: '成功' },
  { id: 2, time: '2024-01-15 15:30:05', user: 'operator1', action: '执行AI策略', ip: '192.168.1.101', result: '成功' },
  { id: 3, time: '2024-01-15 15:28:33', user: 'admin', action: '修改预警规则', ip: '192.168.1.100', result: '成功' },
]

// 获取所有用户
router.get('/', (req, res) => {
  res.json(users.map(u => ({ ...u, password: undefined })))
})

// 获取用户详情
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id))
  if (user) {
    res.json({ ...user, password: undefined })
  } else {
    res.status(404).json({ error: 'User not found' })
  }
})

// 创建用户
router.post('/', (req, res) => {
  const newUser = {
    id: users.length + 1,
    ...req.body,
    status: 'active',
    lastLogin: null
  }
  users.push(newUser)
  res.json({ success: true, user: { ...newUser, password: undefined } })
})

// 更新用户
router.put('/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id))
  if (user) {
    Object.assign(user, req.body)
    res.json({ success: true, user: { ...user, password: undefined } })
  } else {
    res.status(404).json({ error: 'User not found' })
  }
})

// 删除用户
router.delete('/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id))
  if (index > -1) {
    users.splice(index, 1)
    res.json({ success: true })
  } else {
    res.status(404).json({ error: 'User not found' })
  }
})

// 获取角色列表
router.get('/roles/all', (req, res) => {
  res.json(roles)
})

// 获取操作日志
router.get('/logs/all', (req, res) => {
  res.json(logs)
})

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username)
  
  if (user && password === '123456') { // 简化验证
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: { ...user, password: undefined }
    })
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

export default router
