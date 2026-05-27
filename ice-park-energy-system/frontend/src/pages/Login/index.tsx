import { useState } from 'react'
import { Form, Input, Button, Card, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { userApi } from '@/services/api'
import { useAppStore } from '@/store'
import styles from './index.module.scss'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAppStore(state => state.setUser)

  const onFinish = async (values: { username: string; password: string; remember: boolean }) => {
    try {
      setLoading(true)
      const res = await userApi.login(values.username, values.password) as any
      
      if (res.success) {
        localStorage.setItem('token', res.token)
        if (values.remember) {
          localStorage.setItem('username', values.username)
        }
        setUser(res.user)
        message.success('登录成功')
        navigate('/')
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.background}>
        <div className={styles.particles}></div>
      </div>
      
      <Card className={styles.loginCard}>
        <div className={styles.logo}>
          <span className={styles.icon}>❄️</span>
          <h1>智慧冰雕园区</h1>
          <p>能源与碳管理系统</p>
        </div>
        
        <Form
          name="login"
          initialValues={{ 
            username: localStorage.getItem('username') || '',
            remember: true 
          }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住用户名</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.tips}>
          <p>演示账号: admin / 123456</p>
        </div>
      </Card>

      <div className={styles.footer}>
        © 2024 智慧冰雕园区能源与碳管理系统
      </div>
    </div>
  )
}

export default Login
