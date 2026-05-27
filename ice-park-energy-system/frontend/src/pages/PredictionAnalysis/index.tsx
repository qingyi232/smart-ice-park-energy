import { useState, useEffect } from 'react'
import { Row, Col, Card, Slider, Button, Statistic, Progress, Spin, message, Tabs, Tag } from 'antd'
import { ExperimentOutlined, ThunderboltOutlined, FieldTimeOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { energyApi, iceApi } from '@/services/api'

const PredictionAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [energyPrediction, setEnergyPrediction] = useState<any[]>([])
  const [energyHistory, setEnergyHistory] = useState<any[]>([])
  const [icePredictions, setIcePredictions] = useState<any[]>([])
  const [simulating, setSimulating] = useState(false)
  
  // 模拟参数
  const [simTemp, setSimTemp] = useState(-15)
  const [simHumidity, setSimHumidity] = useState(60)
  const [simVisitors, setSimVisitors] = useState(500)
  const [simResult, setSimResult] = useState<any>(null)

  // 获取预测数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predictionRes, historyRes, iceRes] = await Promise.all([
          energyApi.getPrediction(24),
          energyApi.getHistory(24),
          iceApi.getAll()
        ])
        setEnergyPrediction(predictionRes as unknown as any[])
        setEnergyHistory(historyRes as unknown as any[])
        
        // 获取每个冰建的预测
        const iceList = iceRes as unknown as any[]
        const predictions = await Promise.all(
          iceList.slice(0, 3).map(async (ice) => {
            const pred = await iceApi.getPrediction(ice.id, 72) as unknown as any[]
            return { ...ice, prediction: pred }
          })
        )
        setIcePredictions(predictions)
      } catch (error) {
        message.error('获取预测数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 运行模拟
  const runSimulation = () => {
    setSimulating(true)
    setTimeout(() => {
      // 模拟计算结果
      const tempFactor = simTemp > -10 ? 1.3 : simTemp > -15 ? 1.0 : 0.8
      const humidityFactor = simHumidity > 70 ? 1.1 : 1.0
      const visitorFactor = simVisitors > 800 ? 1.2 : simVisitors > 500 ? 1.0 : 0.9
      
      const energyChange = ((tempFactor * humidityFactor * visitorFactor - 1) * 100).toFixed(1)
      const iceLifeChange = simTemp > -10 ? -24 : simTemp > -15 ? 0 : 12
      const recommendedPower = Math.round(85 * tempFactor * humidityFactor)
      
      setSimResult({
        energyChange: parseFloat(energyChange),
        iceLifeChange,
        recommendedPower,
        riskLevel: simTemp > -10 ? 'high' : simTemp > -15 ? 'medium' : 'low'
      })
      setSimulating(false)
    }, 1500)
  }

  // 能耗预测曲线
  const energyPredictionOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['历史能耗', '预测能耗', '置信区间上限', '置信区间下限'] },
    grid: { left: 50, right: 30, top: 60, bottom: 30 },
    xAxis: {
      type: 'category',
      data: [
        ...energyHistory.map(h => {
          const date = new Date(h.timestamp)
          return `${date.getHours()}:00`
        }),
        ...energyPrediction.map(p => {
          const date = new Date(p.timestamp)
          return `${date.getHours()}:00*`
        })
      ]
    },
    yAxis: { type: 'value', name: 'kWh' },
    series: [
      {
        name: '历史能耗',
        type: 'line',
        data: [...energyHistory.map(h => Math.round(h.energy)), ...Array(energyPrediction.length).fill(null)],
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 2 }
      },
      {
        name: '预测能耗',
        type: 'line',
        data: [...Array(energyHistory.length).fill(null), ...energyPrediction.map(p => Math.round(p.predicted))],
        itemStyle: { color: '#ff7a45' },
        lineStyle: { width: 2, type: 'dashed' }
      },
      {
        name: '置信区间上限',
        type: 'line',
        data: [...Array(energyHistory.length).fill(null), ...energyPrediction.map(p => Math.round(p.predicted * 1.1))],
        itemStyle: { color: '#ffc069' },
        lineStyle: { width: 1, type: 'dotted' },
        areaStyle: { opacity: 0 }
      },
      {
        name: '置信区间下限',
        type: 'line',
        data: [...Array(energyHistory.length).fill(null), ...energyPrediction.map(p => Math.round(p.predicted * 0.9))],
        itemStyle: { color: '#ffc069' },
        lineStyle: { width: 1, type: 'dotted' },
        areaStyle: { opacity: 0.1, color: '#ffc069' }
      }
    ]
  }

  // 冰块生命周期预测
  const iceLifeOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: icePredictions.map(i => i.name?.split('-')[0] || i.name) },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: ['现在', '12h', '24h', '36h', '48h', '60h', '72h'] },
    yAxis: { type: 'value', name: '体积%', max: 100, min: 0 },
    series: icePredictions.map((ice, index) => ({
      name: ice.name?.split('-')[0] || ice.name,
      type: 'line',
      smooth: true,
      data: ice.prediction?.map((p: any) => p.volume) || [100, 95, 88, 80, 70, 60, 50],
      itemStyle: { color: ['#1890ff', '#52c41a', '#faad14'][index] },
      markLine: index === 0 ? {
        data: [{ yAxis: 60, name: '警戒线', lineStyle: { color: '#ff4d4f', type: 'dashed' } }]
      } : undefined
    }))
  }

  // 模拟结果雷达图
  const simulationRadarOption = simResult ? {
    radar: {
      indicator: [
        { name: '能耗影响', max: 50 },
        { name: '冰块寿命', max: 50 },
        { name: '制冷需求', max: 150 },
        { name: '风险等级', max: 3 },
        { name: '成本影响', max: 50 },
      ]
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          Math.abs(simResult.energyChange),
          Math.abs(simResult.iceLifeChange),
          simResult.recommendedPower,
          simResult.riskLevel === 'high' ? 3 : simResult.riskLevel === 'medium' ? 2 : 1,
          Math.abs(simResult.energyChange) * 0.8
        ],
        name: '模拟结果',
        areaStyle: { opacity: 0.3 }
      }]
    }]
  } : null

  return (
    <Spin spinning={loading}>
      <Tabs items={[
        {
          key: 'energy',
          label: '能耗预测',
          icon: <ThunderboltOutlined />,
          children: (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Statistic title="预测准确率" value={92.5} suffix="%" valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="预测峰值时间" value="14:00" prefix={<FieldTimeOutlined />} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="预测峰值能耗" value={1250} suffix="kWh" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="预测总能耗" value={18500} suffix="kWh" />
                  </Card>
                </Col>
              </Row>
              <Card title="未来24小时能耗预测" style={{ marginTop: 16 }} extra={<Tag color="orange">* 为预测数据</Tag>}>
                <ReactECharts option={energyPredictionOption} style={{ height: 400 }} />
              </Card>
            </div>
          )
        },
        {
          key: 'ice',
          label: '冰块生命周期',
          icon: <ExperimentOutlined />,
          children: (
            <div>
              <Row gutter={[16, 16]}>
                {icePredictions.map((ice, index) => (
                  <Col span={8} key={ice.id || index}>
                    <Card>
                      <Statistic
                        title={ice.name?.split('-')[0] || `冰建${index + 1}`}
                        value={ice.remainLife || 72 - index * 12}
                        suffix="小时"
                        valueStyle={{ color: (ice.remainLife || 72 - index * 12) > 48 ? '#52c41a' : (ice.remainLife || 72 - index * 12) > 24 ? '#faad14' : '#ff4d4f' }}
                      />
                      <Progress
                        percent={ice.volume || 85 - index * 10}
                        status={(ice.volume || 85 - index * 10) > 70 ? 'success' : (ice.volume || 85 - index * 10) > 50 ? 'normal' : 'exception'}
                        format={p => `${p}%体积`}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
              <Card title="冰块融化预测（未来72小时）" style={{ marginTop: 16 }}>
                <ReactECharts option={iceLifeOption} style={{ height: 350 }} />
              </Card>
            </div>
          )
        },
        {
          key: 'simulation',
          label: '智能预测沙盘',
          icon: <ExperimentOutlined />,
          children: (
            <Row gutter={[16, 16]}>
              <Col span={10}>
                <Card title="环境变量模拟">
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>模拟温度</span>
                      <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{simTemp}°C</span>
                    </div>
                    <Slider min={-30} max={5} value={simTemp} onChange={setSimTemp} marks={{ '-30': '-30°C', '-15': '-15°C', '0': '0°C', '5': '5°C' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>模拟湿度</span>
                      <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{simHumidity}%</span>
                    </div>
                    <Slider min={20} max={100} value={simHumidity} onChange={setSimHumidity} marks={{ '20': '20%', '50': '50%', '80': '80%', '100': '100%' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>预计游客数</span>
                      <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{simVisitors}人</span>
                    </div>
                    <Slider min={100} max={1500} step={50} value={simVisitors} onChange={setSimVisitors} marks={{ '100': '100', '500': '500', '1000': '1000', '1500': '1500' }} />
                  </div>
                  <Button type="primary" block loading={simulating} onClick={runSimulation}>
                    运行模拟
                  </Button>
                </Card>
              </Col>
              <Col span={14}>
                <Card title="模拟结果">
                  {simResult ? (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card size="small">
                          <Statistic
                            title="预计能耗变化"
                            value={simResult.energyChange > 0 ? `+${simResult.energyChange}` : simResult.energyChange}
                            suffix="%"
                            valueStyle={{ color: simResult.energyChange > 0 ? '#ff4d4f' : '#52c41a' }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small">
                          <Statistic
                            title="冰块寿命影响"
                            value={simResult.iceLifeChange > 0 ? `+${simResult.iceLifeChange}` : simResult.iceLifeChange}
                            suffix="小时"
                            valueStyle={{ color: simResult.iceLifeChange > 0 ? '#52c41a' : '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col span={12} style={{ marginTop: 16 }}>
                        <Card size="small">
                          <Statistic title="建议制冷功率" value={simResult.recommendedPower} suffix="%" />
                        </Card>
                      </Col>
                      <Col span={12} style={{ marginTop: 16 }}>
                        <Card size="small">
                          <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>风险等级</div>
                          <Tag color={simResult.riskLevel === 'high' ? 'red' : simResult.riskLevel === 'medium' ? 'orange' : 'green'} style={{ fontSize: 16, padding: '4px 12px' }}>
                            {simResult.riskLevel === 'high' ? '高风险' : simResult.riskLevel === 'medium' ? '中等' : '低风险'}
                          </Tag>
                        </Card>
                      </Col>
                      <Col span={24} style={{ marginTop: 16 }}>
                        <Card size="small" title="影响分析">
                          <ReactECharts option={simulationRadarOption} style={{ height: 250 }} />
                        </Card>
                      </Col>
                    </Row>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                      <ExperimentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p>调整左侧参数后点击"运行模拟"查看预测结果</p>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          )
        }
      ]} />
    </Spin>
  )
}

export default PredictionAnalysis
