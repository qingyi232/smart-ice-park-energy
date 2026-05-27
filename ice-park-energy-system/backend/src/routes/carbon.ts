import { Router } from 'express'

const router = Router()

// 碳资产钱包
const wallet = {
  balance: 156.8,
  locked: 20.0,
  available: 136.8,
  totalEarned: 245.5,
  totalSpent: 88.7
}

// 交易记录
const transactions = [
  { id: 1, time: '2024-01-15 14:30', type: 'earn', amount: 1.5, source: '节能减排奖励', txHash: '0x8f7d3a2b', status: 'confirmed' },
  { id: 2, time: '2024-01-14 10:15', type: 'trade', amount: -5.0, source: '碳配额交易', txHash: '0x2c4e9f1d', status: 'confirmed' },
  { id: 3, time: '2024-01-13 16:45', type: 'earn', amount: 2.2, source: 'AI优化奖励', txHash: '0x6b3a7e5c', status: 'confirmed' },
  { id: 4, time: '2024-01-12 09:00', type: 'offset', amount: -10.0, source: '碳中和抵消', txHash: '0x1d9f4b8a', status: 'confirmed' },
]

// 获取钱包信息
router.get('/wallet', (req, res) => {
  res.json(wallet)
})

// 获取交易记录
router.get('/transactions', (req, res) => {
  res.json(transactions)
})

// 获取碳排放报告
router.get('/report', (req, res) => {
  const { period } = req.query
  
  res.json({
    period: period || 'monthly',
    emission: 50,
    reduction: 16,
    netEmission: 34,
    breakdown: [
      { source: '制冷系统', emission: 32, reduction: 8 },
      { source: '照明系统', emission: 8, reduction: 3 },
      { source: '循环系统', emission: 6, reduction: 3 },
      { source: '其他', emission: 4, reduction: 2 }
    ]
  })
})

// 获取碳流数据
router.get('/flow', (req, res) => {
  res.json([
    { stage: '初始排放', value: 50, type: 'emission' },
    { stage: '制冷优化', value: -8, type: 'reduction' },
    { stage: 'AI策略', value: -5, type: 'reduction' },
    { stage: '设备升级', value: -3, type: 'reduction' },
    { stage: '碳抵消', value: -10, type: 'offset' },
    { stage: '净排放', value: 24, type: 'net' }
  ])
})

// 获取智能合约列表
router.get('/contracts', (req, res) => {
  res.json([
    { id: 1, name: '碳配额自动交易合约', address: '0x742d35Cc', status: 'active', executions: 23 },
    { id: 2, name: '节能奖励发放合约', address: '0x8Ba17Fa3', status: 'active', executions: 156 },
    { id: 3, name: '碳中和认证合约', address: '0x3Cd29Eb4', status: 'active', executions: 8 }
  ])
})

export default router
