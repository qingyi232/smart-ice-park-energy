import { create } from 'zustand'
import { Device, IceSculpture, User } from '@/types'

interface AppState {
  // 用户状态
  user: User | null
  setUser: (user: User | null) => void
  
  // 主题
  theme: 'light' | 'dark'
  toggleTheme: () => void
  
  // 实时数据
  realtimeEnergy: number
  setRealtimeEnergy: (value: number) => void
  
  // 预警数量
  pendingAlerts: number
  setPendingAlerts: (count: number) => void
  
  // 设备列表
  devices: Device[]
  setDevices: (devices: Device[]) => void
  
  // 冰建列表
  iceSculptures: IceSculpture[]
  setIceSculptures: (sculptures: IceSculpture[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  // 用户
  user: null,
  setUser: (user) => set({ user }),
  
  // 主题
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  
  // 实时能耗
  realtimeEnergy: 0,
  setRealtimeEnergy: (value) => set({ realtimeEnergy: value }),
  
  // 预警
  pendingAlerts: 0,
  setPendingAlerts: (count) => set({ pendingAlerts: count }),
  
  // 设备
  devices: [],
  setDevices: (devices) => set({ devices }),
  
  // 冰建
  iceSculptures: [],
  setIceSculptures: (sculptures) => set({ iceSculptures: sculptures }),
}))
