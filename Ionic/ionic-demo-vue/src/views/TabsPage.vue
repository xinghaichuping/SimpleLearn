<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="homeOutline" />
          <ion-label>首页</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="search" href="/tabs/search">
          <ion-icon :icon="searchOutline" />
          <ion-label>单词查询</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="preview" href="/tabs/preview">
          <ion-icon :icon="bookOutline" />
          <ion-label>内容预览</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="feedback" href="/tabs/feedback">
          <ion-icon :icon="chatboxEllipsesOutline" />
          <ion-label>反馈</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personOutline" />
          <ion-label>我的</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel,
} from '@ionic/vue'
import { homeOutline, searchOutline, bookOutline, personOutline, chatboxEllipsesOutline } from 'ionicons/icons'
</script>
