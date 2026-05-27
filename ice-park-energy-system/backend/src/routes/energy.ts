import { Router } from 'express'
import { generateHistoryData, generatePrediction } from '../services/simulation'

const router = Router()

// 获取能耗概览
router.get('/overview', (req, res) => {
  res.json({
    today: {
      total: 12580,
      target: 13000,
      saving: 420,
      savingRate: 3.2
    },
    realtime: {
      power: 856,
      load: 72
    },
    comparison: {
      yesterday: 13200,
      lastWeek: 12800,
      lastMonth: 13500
    }
  })
})

// 获取历史能耗数据
router.get('/history', (req, res) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(generateHistoryData(hours))
})

// 获取能耗预测
router.get('/prediction', (req, res) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(generatePrediction(hours))
})

// 获取分区域能耗
router.get('/by-area', (req, res) => {
  res.json([
    { area: 'A区-主展区', energy: 4500, percentage: 37.5 },
    { area: 'B区-互动区', energy: 3200, percentage: 26.7 },
    { area: 'C区-餐饮区', energy: 2800, percentage: 23.3 },
    { area: 'D区-服务区', energy: 1500, percentage: 12.5 }
  ])
})

// 获取分类型能耗
router.get('/by-type', (req, res) => {
  res.json([
    { type: '制冷系统', energy: 6800, percentage: 56.7 },
    { type: '照明系统', energy: 2100, percentage: 17.5 },
    { type: '循环系统', energy: 1800, percentage: 15.0 },
    { type: '其他设备', energy: 1300, percentage: 10.8 }
  ])
})

export default router
