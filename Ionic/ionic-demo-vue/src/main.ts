import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
/* Ionic 的核心样式表 比如 <ion-button color="primary"> */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic 
Ionic 的基础样式模块
用于统一样式，消除不同浏览器之间的默认样式差
确保页面滚动在移动设备上拥有原生般的使用体验
提供统一的、规范的全局字体和排版样式
*/
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
// ionic 的边框模块，可以省写部分 padding 的 css 代码
import '@ionic/vue/css/float-elements.css';

import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

const app = createApp(App)
  .use(IonicVue)
  .use(router);

router.isReady().then(() => {
  app.mount('#app');
});
// isReady 避免用户在首次加载时看到因跳转或异步加载导致的闪烁或空白。
