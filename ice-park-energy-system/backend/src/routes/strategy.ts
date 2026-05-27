import { Router } from 'express'

const router = Router()

let strategies = [
  { id: 1, name: '制冷机组功率优化', type: 'AI推荐', expectedSave: '12%', status: 'pending', confidence: 92, description: '建议将2号机组功率降低15%，3号机组提升5%进行负载均衡' },
  { id: 2, name: '夜间低谷运行策略', type: 'AI推荐', expectedSave: '8%', status: 'executed', confidence: 88, description: '利用夜间电价低谷期进行预冷储能' },
  { id: 3, name: '高峰期负载转移', type: 'AI推荐', expectedSave: '15%', status: 'pending', confidence: 85, description: '将14:00-16:00高峰期部分负载转移至备用机组' },
  { id: 4, name: '循环泵变频控制', type: '手动', expectedSave: '5%', status: 'executed', confidence: 95, description: '根据实际需求动态调整循环泵频率' },
]

const executionHistory = [
  { id: 1, time: '2024-01-15 14:00', strategyId: 2, strategyName: '夜间低谷运行策略', result: '成功', actualSave: '9.2%' },
  { id: 2, time: '2024-01-14 22:00', strategyId: 4, strategyName: '循环泵变频控制', result: '成功', actualSave: '5.8%' },
  { id: 3, time: '2024-01-14 10:00', strategyId: 1, strategyName: '制冷机组功率优化', result: '成功', actualSave: '11.5%' },
  { id: 4, time: '2024-01-13 14:00', strategyId: 3, strategyName: '高峰期负载转移', result: '部分成功', actualSave: '8.2%' },
]

// 获取所有策略
router.get('/', (req, res) => {
  res.json(strategies)
})

// 获取策略详情
router.get('/:id', (req, res) => {
  const strategy = strategies.find(s => s.id === parseInt(req.params.id))
  if (strategy) {
    res.json(strategy)
  } else {
    res.status(404).json({ error: 'Strategy not found' })
  }
})

// 执行策略
router.post('/:id/execute', (req, res) => {
  const strategy = strategies.find(s => s.id === parseInt(req.params.id))
  
  if (!strategy) {
    return res.status(404).json({ error: 'Strategy not found' })
  }

  // 模拟执行
  strategy.status = 'executed'
  
  const execution = {
    id: executionHistory.length + 1,
    time: new Date().toISOString(),
    strategyId: strategy.id,
    strategyName: strategy.name,
    result: '成功',
    actualSave: strategy.expectedSave
  }
  
  executionHistory.unshift(execution)
  
  res.json({ success: true, execution })
})

// 获取执行历史
router.get('/history/all', (req, res) => {
  res.json(executionHistory)
})

// 创建手动策略
router.post('/', (req, res) => {
  const newStrategy = {
    id: strategies.length + 1,
    ...req.body,
    type: '手动',
    status: 'pending',
    confidence: 100
  }
  strategies.push(newStrategy)
  res.json({ success: true, strategy: newStrategy })
})

// AI优化建议
router.get('/ai/recommendations', (req, res) => {
  res.json({
    recommendations: [
      { type: '制冷优化', suggestion: '当前室外温度较低，建议降低制冷功率10%', impact: '预计节能8%' },
      { type: '负载均衡', suggestion: '2号机组负载过高，建议分流至3号机组', impact: '延长设备寿命' },
      { type: '预测性维护', suggestion: '5号风机轴承温度异常，建议48小时内检修', impact: '避免故障停机' }
    ],
    modelVersion: 'v2.1.0',
    lastUpdate: new Date().toISOString()
  })
})

export default router
