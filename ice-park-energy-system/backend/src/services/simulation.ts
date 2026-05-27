import { Socket } from 'socket.io'

// 模拟实时数据生成
export function startRealtimeSimulation(socket: Socket) {
  const interval = setInterval(() => {
    // 能耗数据
    const energyData = {
      timestamp: new Date().toISOString(),
      totalPower: Math.random() * 200 + 800, // 800-1000 kW
      devices: [
        { id: 1, name: '1号制冷机组', power: Math.random() * 50 + 300 },
        { id: 2, name: '2号制冷机组', power: Math.random() * 50 + 280 },
        { id: 3, name: '3号制冷机组', power: Math.random() * 10 },
        { id: 4, name: '循环水泵-A', power: Math.random() * 10 + 40 },
        { id: 5, name: '循环水泵-B', power: Math.random() * 10 + 38 },
      ]
    }

    // 环境数据
    const environmentData = {
      timestamp: new Date().toISOString(),
      temperature: -15 + Math.random() * 2 - 1, // -16 to -14
      humidity: 60 + Math.random() * 10 - 5, // 55-65
      windSpeed: Math.random() * 3,
      uv: Math.random() * 2,
      co2: 400 + Math.random() * 50
    }

    // 冰块状态
    const iceData = {
      timestamp: new Date().toISOString(),
      sculptures: [
        { id: 1, name: 'A区主冰雕', volume: 85 - Math.random() * 0.1, health: 'good' },
        { id: 2, name: 'B区冰墙', volume: 78 - Math.random() * 0.1, health: 'warning' },
        { id: 3, name: 'C区冰滑梯', volume: 65 - Math.random() * 0.2, health: 'danger' },
      ]
    }

    socket.emit('energy:realtime', energyData)
    socket.emit('environment:realtime', environmentData)
    socket.emit('ice:realtime', iceData)
  }, 2000)

  return interval
}

// 生成历史数据
export function generateHistoryData(hours: number = 24) {
  const data = []
  const now = new Date()
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hour = time.getHours()
    
    // 模拟日间高峰
    const peakFactor = hour >= 10 && hour <= 18 ? 1.3 : 0.8
    
    data.push({
      timestamp: time.toISOString(),
      energy: (800 + Math.random() * 200) * peakFactor,
      temperature: -15 + Math.sin(hour / 24 * Math.PI * 2) * 3,
      humidity: 60 + Math.random() * 10
    })
  }
  
  return data
}

// AI预测模拟
export function generatePrediction(hours: number = 24) {
  const data = []
  const now = new Date()
  
  for (let i = 0; i <= hours; i++) {
    const time = new Date(now.getTime() + i * 60 * 60 * 1000)
    const hour = time.getHours()
    const peakFactor = hour >= 10 && hour <= 18 ? 1.3 : 0.8
    
    data.push({
      timestamp: time.toISOString(),
      predicted: (800 + Math.random() * 100) * peakFactor,
      confidence: 0.85 + Math.random() * 0.1
    })
  }
  
  return data
}
