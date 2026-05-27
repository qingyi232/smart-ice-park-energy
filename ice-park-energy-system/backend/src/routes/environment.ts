import { Router } from 'express'

const router = Router()

// 获取当前环境数据
router.get('/current', (req, res) => {
  res.json({
    temperature: { value: -15, unit: '°C', min: -25, max: -10, status: 'normal' },
    humidity: { value: 62, unit: '%', min: 40, max: 70, status: 'normal' },
    windSpeed: { value: 2.3, unit: 'm/s', min: 0, max: 5, status: 'normal' },
    uv: { value: 1.2, unit: 'mW/cm²', min: 0, max: 3, status: 'normal' },
    co2: { value: 420, unit: 'ppm', min: 300, max: 800, status: 'normal' }
  })
})

// 获取历史环境数据
router.get('/history', (req, res) => {
  const hours = parseInt(req.query.hours as string) || 24
  const data = []
  const now = new Date()
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push({
      timestamp: time.toISOString(),
      temperature: -15 + Math.sin(i / 24 * Math.PI * 2) * 3 + Math.random() * 2 - 1,
      humidity: 60 + Math.random() * 10 - 5,
      windSpeed: Math.random() * 3,
      uv: Math.random() * 2,
      co2: 400 + Math.random() * 50
    })
  }
  
  res.json(data)
})

// 获取阈值设置
router.get('/thresholds', (req, res) => {
  res.json({
    temperature: { min: -25, max: -10 },
    humidity: { min: 40, max: 70 },
    windSpeed: { min: 0, max: 5 },
    uv: { min: 0, max: 3 },
    co2: { min: 300, max: 800 }
  })
})

// 更新阈值设置
router.put('/thresholds', (req, res) => {
  // 实际应用中应保存到数据库
  res.json({ success: true, thresholds: req.body })
})

export default router
