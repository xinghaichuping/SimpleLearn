<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>登录</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="ion-padding ion-text-center">
      <!-- 如果不用 ion-padding ion-text-center 要写 ,默认是padding 16px -->
        <h1>智能英语学习平台</h1>
        <p>使用您的账号登录</p>
      </div>
      <ion-list :inset="true">
        <form @submit.prevent="handleLogin">
          <ion-item>
            <ion-label position="stacked">用户名</ion-label>
            <ion-input v-model="username" name="username" autocomplete="username" type="text" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">密码</ion-label>
            <ion-input v-model="password" name="password" autocomplete="current-password" type="password" />
          </ion-item>
          <div class="ion-text-center ion-padding">
            <ion-button type="submit" expand="block">登录</ion-button>
          </div>
        </form>
      </ion-list>
      <div class="ion-text-center">
        <router-link to="/register" class="register-link">没有账号？立即注册</router-link>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  toastController,
  loadingController,
} from '@ionic/vue'
import { login } from '@/services/api'
import { setAuth } from '@/services/auth'

const username = ref('')
const password = ref('')
const router = useRouter()

const handleLogin = async () => {
  const loader = await loadingController.create({ message: '登录中...' })
  const toast = await toastController.create({ duration: 3000 })

  try {
    await loader.present()

    if (!username.value) {
      toast.message = '请输入用户名'
      // Ionic的Toast组件,显示例的出现在屏幕上 使用 .present() 功能显示出来
      await toast.present()
      return
    }

    if (!password.value) {
      toast.message = '请输入密码'
      await toast.present()
      return
    }

    console.log('doing... login ')
    const data = await login(username.value, password.value)
    console.log('login successful')
    setAuth(data)
    
    toast.message = '登录成功'
    await toast.present()
    if (data.is_admin) {
      router.replace('/admin/Users')
    } else {
      router.replace('/home')
    }
  } catch (error: any) {
    console.log('catch error any')
    toast.message = error.message || '登录失败，请检查网络连接'
    await toast.present()
  } finally {
    await loader.dismiss()
  }
}
</script>

<style scoped>
.register-link {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-size: 14px;
}
</style>
