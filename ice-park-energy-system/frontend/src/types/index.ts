// 设备类型
export interface Device {
  id: number
  name: string
  type: string
  status: 'running' | 'standby' | 'fault'
  power: number
  efficiency: 'A' | 'B' | 'C'
  health: number
  location: string
}

// 预警类型
export interface Alert {
  id: number
  time: string
  level: 'error' | 'warning' | 'info' | 'success'
  type: string
  content: string
  status: 'pending' | 'resolved'
}

// 预警规则
export interface AlertRule {
  id: number
  name: string
  param: string
  condition: string
  level: 'error' | 'warning' | 'info'
  enabled: boolean
}

// 环境数据
export interface EnvironmentData {
  temperature: number
  humidity: number
  windSpeed: number
  uv: number
  co2: number
  timestamp: string
}

// 冰建状态
export interface IceSculpture {
  id: number
  name: string
  volume: number
  health: 'good' | 'warning' | 'danger'
  remainLife: number
  mainFactor: string
  area: string
}

// 能耗数据
export interface EnergyData {
  timestamp: string
  totalPower: number
  devices: {
    id: number
    name: string
    power: number
  }[]
}

// AI策略
export interface Strategy {
  id: number
  name: string
  type: 'AI推荐' | '手动'
  expectedSave: string
  status: 'pending' | 'executed'
  confidence: number
  description: string
}

// 碳交易
export interface CarbonTransaction {
  id: number
  time: string
  type: 'earn' | 'trade' | 'offset'
  amount: number
  source: string
  txHash: string
  status: 'confirmed' | 'pending'
}

// 用户
export interface User {
  id: number
  username: string
  name: string
  role: string
  status: 'active' | 'inactive'
  lastLogin: string
}

// 边缘节点
export interface EdgeNode {
  id: number
  name: string
  location: string
  status: 'online' | 'warning' | 'offline'
  cpu: number
  memory: number
  network: number
  tasks: number
}
