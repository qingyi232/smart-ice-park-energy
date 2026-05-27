import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (this.socket?.connected) return

    this.socket = io('/', {
      transports: ['websocket'],
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // 订阅实时能耗数据
  onEnergyData(callback: (data: any) => void) {
    this.socket?.on('energy:realtime', callback)
  }

  // 订阅实时环境数据
  onEnvironmentData(callback: (data: any) => void) {
    this.socket?.on('environment:realtime', callback)
  }

  // 订阅实时冰块数据
  onIceData(callback: (data: any) => void) {
    this.socket?.on('ice:realtime', callback)
  }

  // 订阅预警通知
  onAlert(callback: (data: any) => void) {
    this.socket?.on('alert:new', callback)
  }

  // 取消订阅
  off(event: string) {
    this.socket?.off(event)
  }
}

export const socketService = new SocketService()
export default socketService
