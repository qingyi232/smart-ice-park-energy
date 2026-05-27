import { Router } from 'express'

const router = Router()

const iceSculptures = [
  { id: 1, name: 'A区主冰雕-龙腾盛世', volume: 85, health: 'good', remainLife: 72, mainFactor: '温度稳定', area: 'A区' },
  { id: 2, name: 'A区副冰雕-凤舞九天', volume: 82, health: 'good', remainLife: 68, mainFactor: '温度稳定', area: 'A区' },
  { id: 3, name: 'B区冰墙-极光之门', volume: 78, health: 'warning', remainLife: 56, mainFactor: '局部温度偏高', area: 'B区' },
  { id: 4, name: 'B区冰柱群', volume: 90, health: 'good', remainLife: 80, mainFactor: '位置优越', area: 'B区' },
  { id: 5, name: 'C区冰滑梯', volume: 65, health: 'danger', remainLife: 36, mainFactor: '人流摩擦', area: 'C区' },
  { id: 6, name: 'C区冰迷宫', volume: 72, health: 'warning', remainLife: 48, mainFactor: '通风不足', area: 'C区' },
]

// 获取所有冰建状态
router.get('/', (req, res) => {
  res.json(iceSculptures)
})

// 获取冰建详情
router.get('/:id', (req, res) => {
  const ice = iceSculptures.find(i => i.id === parseInt(req.params.id))
  if (ice) {
    res.json(ice)
  } else {
    res.status(404).json({ error: 'Ice sculpture not found' })
  }
})

// 获取体积变化历史
router.get('/:id/history', (req, res) => {
  const days = parseInt(req.query.days as string) || 7
  const ice = iceSculptures.find(i => i.id === parseInt(req.params.id))
  
  if (!ice) {
    return res.status(404).json({ error: 'Ice sculpture not found' })
  }

  const data = []
  for (let i = days; i >= 0; i--) {
    data.push({
      day: `${i}天前`,
      volume: Math.min(100, ice.volume + i * 2 + Math.random() * 2)
    })
  }
  
  res.json(data.reverse())
})

// 获取融化预测
router.get('/:id/prediction', (req, res) => {
  const hours = parseInt(req.query.hours as string) || 72
  const ice = iceSculptures.find(i => i.id === parseInt(req.params.id))
  
  if (!ice) {
    return res.status(404).json({ error: 'Ice sculpture not found' })
  }

  const data = []
  let currentVolume = ice.volume
  const meltRate = ice.health === 'good' ? 0.3 : ice.health === 'warning' ? 0.5 : 0.8
  
  for (let i = 0; i <= hours; i += 12) {
    data.push({
      hour: i,
      volume: Math.max(0, currentVolume)
    })
    currentVolume -= meltRate * 12
  }
  
  res.json(data)
})

// 获取影响因素分析
router.get('/analysis/factors', (req, res) => {
  res.json([
    { factor: '环境温度', impact: 45, description: '温度每升高1°C，融化速度增加约5%' },
    { factor: '人流摩擦', impact: 25, description: '高人流区域融化速度增加约20%' },
    { factor: '空气湿度', impact: 15, description: '湿度过高会加速表面融化' },
    { factor: '紫外线', impact: 10, description: '直射阳光会加速表面融化' },
    { factor: '其他', impact: 5, description: '包括风速、振动等因素' }
  ])
})

export default router
