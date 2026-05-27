# 智慧冰雕园区能源与碳管理系统

一个集实时监控、智能分析、预测优化、碳资产管理和沉浸式可视化于一体的综合性平台。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Ant Design UI组件库
- ECharts 数据可视化
- Three.js 3D可视化
- Zustand 状态管理
- Socket.io 实时通信

### 后端
- Node.js + Express
- TypeScript
- Socket.io WebSocket
- PostgreSQL 数据库 (可选)
- Redis 缓存 (可选)

## 功能模块

1. **综合监控首页** - 核心指标看板、AI策略入口
2. **中央可视化大屏** - 3D数字孪生园区、科幻风仪表盘
3. **实时监测** - 设备状态、功率曲线、能耗排名
4. **能耗分析** - 多维度分析、相关性分析
5. **预测分析** - 能耗预测、冰块生命周期预测
6. **设备管理** - 设备列表、远程控制、一键巡检
7. **环境监测** - 温湿度、风速、紫外线、CO2监测
8. **冰块状态** - 冰建监测、寿命分析
9. **预警中心** - 预警处理、规则管理
10. **AI策略优化** - 策略推荐、执行历史、优化仿真
11. **能碳报表** - 能源消耗报表、碳排放报告
12. **碳资产区块链** - 碳资产钱包、智能合约、碳流追踪
13. **边缘计算监控** - 节点监控、任务管理
14. **系统管理** - 用户管理、角色权限、系统参数

## 快速开始

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd ../backend && npm install
```

### 开发模式

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:frontend  # 前端 http://localhost:3000
npm run dev:backend   # 后端 http://localhost:4000
```

### 生产构建

```bash
npm run build
```

## 项目结构

```
ice-park-energy-system/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── services/        # API服务
│   │   ├── store/           # 状态管理
│   │   ├── types/           # 类型定义
│   │   └── styles/          # 样式文件
│   └── package.json
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── services/        # 业务服务
│   │   └── index.ts         # 入口文件
│   └── package.json
└── package.json              # 根配置
```

## 开发计划

- [x] 项目框架搭建
- [x] 14个页面基础实现
- [x] 后端API接口
- [ ] 3D数字孪生园区
- [ ] AI预测模型集成
- [ ] 区块链碳资产功能
- [ ] 边缘计算节点对接
- [ ] 多语言支持
- [ ] 移动端适配

## 许可证

MIT
