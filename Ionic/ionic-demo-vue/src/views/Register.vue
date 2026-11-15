<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>注册</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="ion-padding ion-text-center">
        <!-- ion-padding 等价于写了一个 .my-div {
          padding: 16px;     /* 来自 ion-padding */
          text-align: center;/* 来自 ion-text-center */
        } -->
        <h1>创建账号</h1>
        <p>注册后即可使用智能英语学习平台</p>
      </div>
      <ion-list :inset="true">
        <form @submit.prevent="handleRegister">
          <ion-item>
            <ion-label position="stacked">用户名</ion-label>
            <ion-input v-model="username" name="username" autocomplete="username" type="text" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">密码</ion-label>
            <ion-input v-model="password" name="password" type="password" />
          </ion-item>
          <div class="ion-text-center ion-padding">
            <ion-button type="submit" expand="block">注册</ion-button>
          </div>
        </form>
      </ion-list>
      <div class="ion-text-center">
        <router-link to="/login" class="login-link">已有账号？立即登录</router-link>
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
import { register } from '@/services/api'
import { setAuth } from '@/services/auth'

const username = ref('')
const password = ref('')
const router = useRouter()

const handleRegister = async () => {
  const loader = await loadingController.create({ message: '注册中...' })
  const toast = await toastController.create({ duration: 3000 })

  try {
    await loader.present()

    if (!username.value || !password.value) {
      toast.message = '请输入用户名和密码'
      await toast.present()
      return
    }

    const data = await register(username.value, password.value)
    setAuth(data)

    toast.message = '注册成功'
    await toast.present()
    router.replace('/home')
  } catch (error: any) {
    toast.message = error.message || '注册失败，请检查网络连接'
    await toast.present()
  } finally {
    await loader.dismiss()
  }
}
</script>

<style scoped>
.login-link {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-size: 14px;
}
</style>
