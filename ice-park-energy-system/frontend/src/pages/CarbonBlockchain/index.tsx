import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Timeline, Descriptions, Tabs, Spin, message, Progress } from 'antd'
import { WalletOutlined, FileProtectOutlined, NodeIndexOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { carbonApi } from '@/services/api'

const CarbonBlockchain = () => {
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [carbonFlow, setCarbonFlow] = useState<any[]>([])

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, txRes, contractsRes, flowRes] = await Promise.all([
          carbonApi.getWallet(),
          carbonApi.getTransactions(),
          carbonApi.getContracts(),
          carbonApi.getFlow()
        ])
        setWallet(walletRes as unknown as any)
        setTransactions((txRes as unknown as any[]).map((t, i) => ({ ...t, key: i })))
        setContracts(contractsRes as unknown as any[])
        setCarbonFlow(flowRes as unknown as any[])
      } catch (error) {
        message.error('获取碳资产数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 碳流瀑布图
  const waterfallOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 30, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: carbonFlow.map(f => f.stage) },
    yAxis: { type: 'value', name: '吨CO₂' },
    series: [{
      type: 'bar',
      data: carbonFlow.map(f => ({
        value: f.value,
        itemStyle: {
          color: f.type === 'emission' ? '#ff4d4f' : f.type === 'reduction' ? '#52c41a' : f.type === 'offset' ? '#1890ff' : '#722ed1'
        }
      })),
      label: {
        show: true,
        position: 'top',
        formatter: (p: any) => p.value > 0 ? `+${p.value}` : p.value
      }
    }]
  }

  // 资产趋势图
  const assetTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 30, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value', name: '吨' },
    series: [{
      type: 'line',
      data: [120, 135, 142, 148, 153, wallet?.balance || 156.8],
      smooth: true,
      areaStyle: {
        opacity: 0.3,
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#722ed1' }, { offset: 1, color: 'rgba(114,46,209,0.1)' }] }
      },
      itemStyle: { color: '#722ed1' },
      lineStyle: { width: 3 }
    }]
  }

  // 交易类型分布
  const txTypeOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: transactions.filter(t => t.type === 'earn').length, name: '获得', itemStyle: { color: '#52c41a' } },
        { value: transactions.filter(t => t.type === 'trade').length, name: '交易', itemStyle: { color: '#1890ff' } },
        { value: transactions.filter(t => t.type === 'offset').length, name: '抵消', itemStyle: { color: '#722ed1' } },
      ]
    }]
  }

  const txColumns = [
    { title: '时间', dataIndex: 'time', width: 160 },
    { title: '类型', dataIndex: 'type', width: 80, render: (t: string) => {
      const config: Record<string, { color: string; label: string }> = {
        earn: { color: 'green', label: '获得' },
        trade: { color: 'blue', label: '交易' },
        offset: { color: 'purple', label: '抵消' }
      }
      return <Tag color={config[t]?.color}>{config[t]?.label}</Tag>
    }},
    { title: '数量(吨)', dataIndex: 'amount', width: 100, render: (a: number) => (
      <span style={{ color: a > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
        {a > 0 ? `+${a}` : a}
      </span>
    )},
    { title: '来源/用途', dataIndex: 'source' },
    { title: '交易哈希', dataIndex: 'txHash', width: 120, render: (h: string) => (
      <a style={{ fontFamily: 'monospace' }}>{h}</a>
    )},
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => (
      <Tag color={s === 'confirmed' ? 'green' : 'orange'}>{s === 'confirmed' ? '已确认' : '待确认'}</Tag>
    )},
  ]

  return (
    <Spin spinning={loading}>
      <Tabs items={[
        {
          key: 'wallet',
          label: '碳资产钱包',
          icon: <WalletOutlined />,
          children: (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', height: '100%' }}>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>碳资产余额</div>
                    <div style={{ fontSize: 42, fontWeight: 'bold', margin: '12px 0' }}>
                      {wallet?.balance || 0} <span style={{ fontSize: 18 }}>吨</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.9 }}>
                      <span>可用: {wallet?.available || 0} 吨</span>
                      <span>锁定: {wallet?.locked || 0} 吨</span>
                    </div>
                    <Progress percent={((wallet?.available || 0) / (wallet?.balance || 1)) * 100} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" style={{ marginTop: 12 }} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic title="累计获得" value={wallet?.totalEarned || 0} suffix="吨" valueStyle={{ color: '#52c41a' }} />
                    <div style={{ marginTop: 16, color: '#666', fontSize: 12 }}>
                      来源：节能减排奖励、AI优化奖励等
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic title="累计支出" value={wallet?.totalSpent || 0} suffix="吨" valueStyle={{ color: '#ff4d4f' }} />
                    <div style={{ marginTop: 16, color: '#666', fontSize: 12 }}>
                      用途：碳配额交易、碳中和抵消等
                    </div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={16}>
                  <Card title="资产变化趋势">
                    <ReactECharts option={assetTrendOption} style={{ height: 250 }} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="交易类型分布">
                    <ReactECharts option={txTypeOption} style={{ height: 250 }} />
                  </Card>
                </Col>
              </Row>

              <Card title="交易记录" style={{ marginTop: 16 }}>
                <Table columns={txColumns} dataSource={transactions} pagination={{ pageSize: 5 }} size="small" />
              </Card>
            </div>
          )
        },
        {
          key: 'contract',
          label: '智能合约',
          icon: <FileProtectOutlined />,
          children: (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card>
                    <Statistic title="活跃合约" value={contracts.filter(c => c.status === 'active').length} suffix="个" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic title="总执行次数" value={contracts.reduce((sum, c) => sum + c.executions, 0)} suffix="次" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic title="自动化率" value={95} suffix="%" valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
              </Row>

              <Card title="智能合约列表" style={{ marginTop: 16 }}>
                {contracts.map((c, index) => (
                  <Card key={index} size="small" style={{ marginBottom: 16 }} type="inner">
                    <Row gutter={16} align="middle">
                      <Col span={2}>
                        <SafetyCertificateOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                      </Col>
                      <Col span={22}>
                        <Descriptions column={4} size="small">
                          <Descriptions.Item label="合约名称"><strong>{c.name}</strong></Descriptions.Item>
                          <Descriptions.Item label="合约地址">
                            <a style={{ fontFamily: 'monospace' }}>{c.address}</a>
                          </Descriptions.Item>
                          <Descriptions.Item label="状态">
                            <Tag color={c.status === 'active' ? 'green' : 'red'}>{c.status === 'active' ? '运行中' : '已停止'}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="执行次数">{c.executions}次</Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Card>

              <Card title="合约执行原理" style={{ marginTop: 16 }}>
                <Timeline items={[
                  { color: 'blue', children: <div><strong>触发条件</strong><br/>当系统检测到节能达标或碳减排目标完成时自动触发</div> },
                  { color: 'green', children: <div><strong>验证执行</strong><br/>智能合约自动验证数据真实性并执行预设逻辑</div> },
                  { color: 'purple', children: <div><strong>资产转移</strong><br/>碳资产自动转入/转出钱包，全程链上记录</div> },
                  { color: 'gray', children: <div><strong>结果确认</strong><br/>交易完成后生成不可篡改的区块链凭证</div> },
                ]} />
              </Card>
            </div>
          )
        },
        {
          key: 'flow',
          label: '碳流追踪',
          icon: <NodeIndexOutlined />,
          children: (
            <div>
              <Card title="碳流瀑布图 - 本月碳排放全流程">
                <ReactECharts option={waterfallOption} style={{ height: 400 }} />
                <div style={{ marginTop: 16, display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ff4d4f', marginRight: 4 }}></span>碳排放</span>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#52c41a', marginRight: 4 }}></span>碳减排</span>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#1890ff', marginRight: 4 }}></span>碳抵消</span>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#722ed1', marginRight: 4 }}></span>净排放</span>
                </div>
              </Card>

              <Card title="碳流时间线" style={{ marginTop: 16 }}>
                <Timeline items={carbonFlow.map((f, index) => ({
                  color: f.type === 'emission' ? 'red' : f.type === 'reduction' ? 'green' : f.type === 'offset' ? 'blue' : 'purple',
                  children: (
                    <div>
                      <strong>{f.stage}</strong>
                      <div style={{ color: '#666', marginTop: 4 }}>
                        {f.type === 'emission' && `本月初始碳排放: ${f.value}吨 (基于能源消耗计算)`}
                        {f.type === 'reduction' && `通过优化措施减排: ${f.value}吨`}
                        {f.type === 'offset' && `购买碳配额抵消: ${f.value}吨`}
                        {f.type === 'net' && `本月净碳排放: ${f.value}吨`}
                      </div>
                    </div>
                  )
                }))} />
              </Card>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Card style={{ textAlign: 'center', background: '#fff7e6', border: '1px solid #ffd591' }}>
                    <div style={{ fontSize: 14, color: '#d46b08' }}>初始排放</div>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fa8c16' }}>50 吨</div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={{ textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <div style={{ fontSize: 14, color: '#389e0d' }}>总减排量</div>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>-26 吨</div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={{ textAlign: 'center', background: '#f9f0ff', border: '1px solid #d3adf7' }}>
                    <div style={{ fontSize: 14, color: '#531dab' }}>净排放</div>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#722ed1' }}>24 吨</div>
                    <div style={{ fontSize: 12, color: '#666' }}>已完成52%碳中和</div>
                  </Card>
                </Col>
              </Row>
            </div>
          )
        }
      ]} />
    </Spin>
  )
}

const Statistic = ({ title, value, suffix, valueStyle }: any) => (
  <div>
    <div style={{ color: '#666', fontSize: 14 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 'bold', ...valueStyle }}>
      {value}<span style={{ fontSize: 14, fontWeight: 'normal' }}>{suffix}</span>
    </div>
  </div>
)

export default CarbonBlockchain
