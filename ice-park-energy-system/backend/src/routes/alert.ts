import { Router } from 'express'

const router = Router()

let alerts = [
  { id: 1, time: '2024-01-15 15:32:18', level: 'warning', type: '设备异常', content: '3号制冷机组功率波动异常', status: 'pending' },
  { id: 2, time: '2024-01-15 14:28:05', level: 'info', type: '环境预警', content: 'A区温度接近阈值上限(-10°C)', status: 'pending' },
  { id: 3, time: '2024-01-15 12:15:33', level: 'success', type: 'AI通知', content: 'AI优化策略已自动执行，预计节能12%', status: 'resolved' },
  { id: 4, time: '2024-01-15 10:42:19', level: 'error', type: '紧急预警', content: 'C区冰滑梯结构监测异常', status: 'resolved' },
]

let rules = [
  { id: 1, name: '温度超限预警', param: '温度', condition: '> -10°C', level: 'warning', enabled: true },
  { id: 2, name: '湿度超限预警', param: '湿度', condition: '> 70%', level: 'warning', enabled: true },
  { id: 3, name: '设备功率异常', param: '功率波动', condition: '> 20%', level: 'error', enabled: true },
  { id: 4, name: '冰块体积预警', param: '体积', condition: '< 60%', level: 'warning', enabled: true },
]

// 获取所有预警
router.get('/', (req, res) => {
  const { level, status } = req.query
  let result = [...alerts]
  
  if (level && level !== 'all') {
    result = result.filter(a => a.level === level)
  }
  if (status && status !== 'all') {
    result = result.filter(a => a.status === status)
  }
  
  res.json(result)
})

// 处理预警
router.post('/:id/resolve', (req, res) => {
  const alert = alerts.find(a => a.id === parseInt(req.params.id))
  if (alert) {
    alert.status = 'resolved'
    res.json({ success: true, alert })
  } else {
    res.status(404).json({ error: 'Alert not found' })
  }
})

// 获取预警规则
router.get('/rules', (req, res) => {
  res.json(rules)
})

// 创建预警规则
router.post('/rules', (req, res) => {
  const newRule = {
    id: rules.length + 1,
    ...req.body,
    enabled: true
  }
  rules.push(newRule)
  res.json({ success: true, rule: newRule })
})

// 更新预警规则
router.put('/rules/:id', (req, res) => {
  const rule = rules.find(r => r.id === parseInt(req.params.id))
  if (rule) {
    Object.assign(rule, req.body)
    res.json({ success: true, rule })
  } else {
    res.status(404).json({ error: 'Rule not found' })
  }
})

export default router
