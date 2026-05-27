import { useEffect, useState, Suspense } from 'react'
import ReactECharts from 'echarts-for-react'
import { Spin } from 'antd'
import Park3D from './components/Park3D'
import socketService from '@/services/socket'
import styles from './index.module.scss'

const BigScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [realtimeData, setRealtimeData] = useState({
    totalEnergy: 12580,
    savingRate: 18.5,
    carbonReduction: 3.2,
    temperature: -15,
    humidity: 62
  })
  const [deviceHealth, setDeviceHealth] = useState([
    { name: '1号制冷机', health: 98 },
    { name: '2号制冷机', health: 95 },
    { name: '3号制冷机', health: 78 },
    { name: '循环泵组', health: 92 },
  ])
  const [aiMessages, setAiMessages] = useState([
    '🤖 检测到3号机组效率下降，建议检查冷凝器',
    '🤖 预计今日17:00达到用电高峰',
    '🤖 A区冰雕预计寿命还剩72小时',
  ])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // WebSocket实时数据
  useEffect(() => {
    socketService.connect()
    
    socketService.onEnergyData((data) => {
      setRealtimeData(prev => ({
        ...prev,
        totalEnergy: prev.totalEnergy + Math.round(data.totalPower / 60), // 累加
      }))
    })

    socketService.onEnvironmentData((data) => {
      setRealtimeData(prev => ({
        ...prev,
        temperature: data.temperature.toFixed(1),
        humidity: data.humidity.toFixed(0)
      }))
    })

    // 模拟AI消息更新
    const aiTimer = setInterval(() => {
      const messages = [
        '🤖 系统运行正常，能效比达到最优',
        '🤖 检测到温度波动，已自动调整制冷功率',
        '🤖 预测未来2小时能耗将上升15%',
        '🤖 B区冰墙需要关注，建议增加制冷',
        '🤖 当前节能策略执行效果良好',
      ]
      setAiMessages(prev => {
        const newMsg = messages[Math.floor(Math.random() * messages.length)]
        return [newMsg, ...prev.slice(0, 2)]
      })
    }, 10000)

    return () => {
      socketService.off('energy:realtime')
      socketService.off('environment:realtime')
      clearInterval(aiTimer)
    }
  }, [])

  // 能耗预测曲线
  const predictionOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际能耗', '预测能耗'], textStyle: { color: '#fff' } },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLine: { lineStyle: { color: '#3a5f8a' } },
      axisLabel: { color: '#8fabc7' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#3a5f8a' } },
      axisLabel: { color: '#8fabc7' },
      splitLine: { lineStyle: { color: '#1e3a5f' } }
    },
    series: [
      { name: '实际能耗', type: 'line', smooth: true, data: [420, 380, 350, 320, 310, 340, 450, 580, 720, 850, 920, 980, 1020, 1050, 1080, 1020, 950, 880, 780, 650, 550, 480, 450, 420], itemStyle: { color: '#00d4ff' } },
      { name: '预测能耗', type: 'line', smooth: true, data: [430, 390, 360, 330, 320, 350, 460, 590, 730, 860, 930, 990, 1030, 1060, 1090, 1030, 960, 890, 790, 660, 560, 490, 460, 430], itemStyle: { color: '#ff6b6b' }, lineStyle: { type: 'dashed' } }
    ]
  }

  // 环境参数环形图
  const envGaugeOption = {
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: -30,
      max: 10,
      splitNumber: 8,
      axisLine: { lineStyle: { width: 6, color: [[0.25, '#67e0e3'], [0.5, '#37a2da'], [0.75, '#fd666d'], [1, '#ff0000']] } },
      pointer: { itemStyle: { color: '#00d4ff' } },
      axisTick: { lineStyle: { color: '#8fabc7' } },
      splitLine: { lineStyle: { color: '#8fabc7' } },
      axisLabel: { color: '#8fabc7', fontSize: 10 },
      title: { offsetCenter: [0, '70%'], color: '#fff' },
      detail: { valueAnimation: true, formatter: '{value}°C', color: '#00d4ff', fontSize: 24, offsetCenter: [0, '40%'] },
      data: [{ value: -15, name: '园区温度' }]
    }]
  }

  return (
    <div className={styles.bigScreen}>
      {/* 顶部横幅 */}
      <header className={styles.header}>
        <div className={styles.weather}>☀️ 晴 -18°C</div>
        <h1>智慧冰雕园区能源与碳管理系统</h1>
        <div className={styles.time}>
          {currentTime.toLocaleDateString('zh-CN')} {currentTime.toLocaleTimeString('zh-CN')}
        </div>
      </header>

      <div className={styles.content}>
        {/* 左侧面板 */}
        <div className={styles.leftPanel}>
          <div className={styles.card}>
            <h3>核心指标</h3>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.value}>{realtimeData.totalEnergy.toLocaleString()}</span>
                <span className={styles.label}>今日能耗(kWh)</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.value}>{realtimeData.savingRate}%</span>
                <span className={styles.label}>节能率</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.value}>{realtimeData.carbonReduction}</span>
                <span className={styles.label}>碳减排(吨)</span>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <h3>环境参数</h3>
            <ReactECharts option={envGaugeOption} style={{ height: 200 }} />
          </div>
          <div className={styles.card}>
            <h3>AI助手</h3>
            <div className={styles.aiChat}>
              {aiMessages.map((msg, index) => (
                <div key={index} className={styles.message}>{msg}</div>
              ))}
            </div>
          </div>
        </div>

        {/* 中央3D区域 */}
        <div className={styles.centerPanel}>
          <div className={styles.digital3D}>
            <Suspense fallback={
              <div className={styles.placeholder}>
                <Spin size="large" />
                <p>3D场景加载中...</p>
              </div>
            }>
              <Park3D />
            </Suspense>
            <div className={styles.sceneOverlay}>
              <span>🎮 拖拽旋转 | 滚轮缩放</span>
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className={styles.rightPanel}>
          <div className={styles.card}>
            <h3>设备健康度</h3>
            <div className={styles.healthList}>
              {deviceHealth.map((device, index) => (
                <div key={index} className={styles.healthItem}>
                  <span>{device.name}</span>
                  <span className={device.health > 90 ? styles.good : device.health > 70 ? styles.warning : styles.danger}>
                    {device.health}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.card}>
            <h3>环保贡献</h3>
            <div className={styles.ecoContribution}>
              <div className={styles.ecoItem}>🌲 等效植树 <strong>156</strong> 棵</div>
              <div className={styles.ecoItem}>🚗 减少汽车 <strong>1,280</strong> 公里</div>
            </div>
          </div>
          <div className={styles.card}>
            <h3>能耗预测</h3>
            <ReactECharts option={predictionOption} style={{ height: 200 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BigScreen
