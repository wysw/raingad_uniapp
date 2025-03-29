<template>
	<web-view :webview-styles="webviewStyles" src="https://live.thrjyhgw0jopf.xyz/"></web-view>
</template>

<script>
	import statusPoint from '@/components/status.vue'
	import imTab from '@/components/message/im-tab.vue'
	import emoji from '@/utils/emoji.js'
	import { storeToRefs } from 'pinia';
	import { useMsgStore } from '@/store/message';
	import { useloginStore } from '@/store/login'
	import pinia from '@/store/index'
	const msgStore = useMsgStore(pinia)
	const {contacts,unread,msgAt} = storeToRefs(msgStore);
	const userStore = useloginStore(pinia);
	const {multiport} = storeToRefs(userStore);
	export default {
		components: {
		},
		data() {
			return {
				msgAt:msgStore.msgAt,
				appSetting:userStore.appSetting,
				globalConfig:userStore.globalConfig,
                webviewStyles: {
					progress: {
						color: '#FF3333'
					}
				}
			}
		},
		computed:{
		},
		mounted(){
		},
		created:function(){
		},
		methods: {
			
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 20px;
		font-size: 14px;
		line-height: 24px;
	}
	.border-b{
		border-bottom: 1px solid #eee;
	}
	.socket-status{
		background-color: #fde0de;
		height:72rpx;
		border-radius: 36rpx;
		padding:10rpx 16rpx;
	}
	.text-overflow ::v-deep uni-text , .text-overflow ::v-deep uni-text span{
		overflow: hidden !important;
		text-overflow: ellipsis;
		white-space: nowrap !important;
		width:300rpx;
	}
	.top-contacts{
		background-color: #f5f5f5 !important;
	}
	.cu-list.menu-avatar>.cu-item{
		padding-right:30rpx;
		.content{
			line-height: unset;
		}
	}
	.no-click{
		pointer-events:none;
		height:50rpx;
		flex:1;
	}
	.text-overflow ::v-deep ._block ._a{
		color: #aaaaaa !important;
	}
	.bg-notremind{
		background-color: #d1d1d1;
		color: #ffffff;
	}
	.cu-bar.fixed, .nav.fixed{
		z-index:900;
	}
</style>
