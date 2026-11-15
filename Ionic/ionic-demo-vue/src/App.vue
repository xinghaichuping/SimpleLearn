<template>
  <ion-app>
    <ion-router-outlet />
    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="2000"
      color="warning"
      position="top"
      @didDismiss="handleToastDismiss"
    />
  </ion-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IonApp, IonRouterOutlet, IonToast } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { initStorageListener } from '@/services/auth'

const router = useRouter()
const showToast = ref(false)
const toastMessage = ref('')

onMounted(() => {
  initStorageListener((reason) => {
    if (reason === 'logged_out') {
      toastMessage.value = '登录状态已失效，请重新登录'
    } else {
      toastMessage.value = '账号已切换，即将跳转登录页'
    }
    showToast.value = true
  })
})

function handleToastDismiss() {
  showToast.value = false
  router.replace('/login')
}
</script>
