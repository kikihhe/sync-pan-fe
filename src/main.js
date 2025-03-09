// 引入三方组件或者自己定义的组件 css js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn'
import ElementPlus from 'element-plus'

const app = createApp(App)

app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

app.mount('#app')
