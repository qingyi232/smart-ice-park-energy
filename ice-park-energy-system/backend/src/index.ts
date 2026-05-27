import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

// Routes
import energyRoutes from './routes/energy'
import deviceRoutes from './routes/device'
import alertRoutes from './routes/alert'
import environmentRoutes from './routes/environment'
import iceRoutes from './routes/ice'
import carbonRoutes from './routes/carbon'
import userRoutes from './routes/user'
import strategyRoutes from './routes/strategy'

// Services
import { startRealtimeSimulation } from './services/simulation'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/energy', energyRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/environment', environmentRoutes)
app.use('/api/ice', iceRoutes)
app.use('/api/carbon', carbonRoutes)
app.use('/api/users', userRoutes)
app.use('/api/strategy', strategyRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// WebSocket for real-time data
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Start sending real-time data
  const interval = startRealtimeSimulation(socket)
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    clearInterval(interval)
  })
})

const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io }
