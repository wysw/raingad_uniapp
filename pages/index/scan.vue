<template>
	<!-- HTML -->
	    <get-qrcode @success='qrcodeSucess' @error="qrcodeError" ></get-qrcode>
</template>

<script>
	import scan from '@/common/scan.js'
	import getQrcode from '@/components/get-qrcode.vue'
	// 嫌路径长的话可以单独复制出来
	export default {
	        components: {
	            getQrcode
	        },
	        methods: {
	            qrcodeSucess(data) {
					scan.checkQr(data);
					uni.navigateBack({})
	            },
				qrcodeError(err) {
					console.log(err)
					uni.showModal({
					    title: '摄像头授权失败',
					    content: '摄像头授权失败，请检测当前浏览器是否有摄像头权限。',
					    success: () => {
							uni.navigateBack()
					    }
					})
				}
	        }
	    }
</script>

<style>
</style>