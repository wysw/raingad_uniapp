<template>
  <view class="container">
    <web-view
      class="web-view"      
	  :style="{height: webViewHeight}"
      src="https://live.ofmtvu.com/"
    ></web-view>
  </view>
</template>

<script>
import { useMsgStore } from '@/store/message';
import { useloginStore } from '@/store/login';
import pinia from '@/store/index';
const msgStore = useMsgStore(pinia);
const userStore = useloginStore(pinia);
export default {
  components: {},
  data() {
    return {
      msgAt: msgStore.msgAt,
      appSetting: userStore.appSetting,
      globalConfig: userStore.globalConfig,
	  webViewHeight: '790px',
    };
  },
  computed: {},
  mounted() {
	this.setWebViewHeight();

  },
  created: function () {},
  methods: {
	setWebViewHeight() {
      // 获取设备的屏幕高度，动态设置 web-view 高度
      const systemInfo = uni.getSystemInfoSync();
      this.webViewHeight = systemInfo.windowHeight - 52 + 'px';
    }
  },
};
</script>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100upx); /* 全屏高度 */
  .web-view {
    flex: 1;
  }
}
</style>
