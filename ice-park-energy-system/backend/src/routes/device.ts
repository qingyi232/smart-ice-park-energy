import { Router } from 'express'

const router = Router()

const devices = [
  { id: 1, name: '1号制冷机组', type: '制冷设备', status: 'running', power: 320, efficiency: 'A', health: 98, location: 'A区' },
  { id: 2, name: '2号制冷机组', type: '制冷设备', status: 'running', power: 285, efficiency: 'A', health: 95, location: 'B区' },
  { id: 3, name: '3号制冷机组', type: '制冷设备', status: 'standby', power: 0, efficiency: 'B', health: 78, location: 'C区' },
  { id: 4, name: '循环水泵-A', type: '循环设备', status: 'running', power: 45, efficiency: 'A', health: 92, location: '机房' },
  { id: 5, name: '循环水泵-B', type: '循环设备', status: 'running', power: 42, efficiency: 'A', health: 90, location: '机房' },
  { id: 6, name: '照明控制器', type: '照明设备', status: 'running', power: 28, efficiency: 'B', health: 88, location: '全区' },
  { id: 7, name: '温控传感器组', type: '传感器', status: 'running', power: 2, efficiency: 'A', health: 100, location: '全区' },
]

// 获取所有设备
router.get('/', (req, res) => {
  res.json(devices)
})

// 获取设备详情
router.get('/:id', (req, res) => {
  const device = devices.find(d => d.id === parseInt(req.params.id))
  if (device) {
    res.json(device)
  } else {
    res.status(404).json({ error: 'Device not found' })
  }
})

// 设备控制
router.post('/:id/control', (req, res) => {
  const { action, value } = req.body
  const device = devices.find(d => d.id === parseInt(req.params.id))
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' })
  }

  // 模拟控制操作
  if (action === 'power') {
    device.status = value ? 'running' : 'standby'
  } else if (action === 'setPower') {
    device.power = value
  }

  res.json({ success: true, device })
})

// 一键巡检
router.post('/inspection', (req, res) => {
  // 模拟巡检结果
  setTimeout(() => {
    res.json({
      success: true,
      report: {
        totalDevices: devices.length,
        healthy: devices.filter(d => d.health > 90).length,
        warning: devices.filter(d => d.health > 70 && d.health <= 90).length,
        critical: devices.filter(d => d.health <= 70).length,
        recommendations: [
          { deviceId: 3, message: '3号制冷机组健康度较低，建议安排维护' }
        ]
      }
    })
  }, 2000)
})

export default router
