<template>
	<view>
		<cu-custom bgColor="bg-gradual-blue" :isBack="true">
			<template #backText></template>
			<template #content>账号注册</template>
		</cu-custom>
		<view style="height:100rpx;"></view>
		<view class="padding im-flex im-rows im-justify-content-center mb-10">
			<view class="im-flex im-rows im-justify-content-center">
				<image class="login-logo " :src="globalConfig.sysInfo.logo ?? packData.logo" mode="fixWidth"></image>
				
			</view>
		</view>
		<view class="im-flex im-rows im-justify-content-center">{{globalConfig.sysInfo.name ?? packData.name}}</view>
		<form>
			<view class="cu-form-group margin-top">
				<view class="title">账号</view>
				<input :placeholder="placeholder"  class="uni-input" maxlength="32" name="input" v-model="regForm.account" @input="handleInput"/>
			</view>
			<view class="cu-form-group margin-top">
				<view class="title">用户名/昵称</view>
				<input placeholder="请输入用户名或昵称"  maxlength="32" name="input" v-model="regForm.realname"/>
			</view>
			<view class="cu-form-group" v-if="parseInt(globalConfig.sysInfo.regauth)">
				<view class="title">验证码</view>
				<input placeholder="请输入验证码" maxlength="6" name="input" v-model="regForm.code"/>
				<button class='cu-btn bg-blue shadow' @tap="sendCode">发送验证码</button>
			</view>
			<view class="cu-form-group">
				<view class="title">密码</view>
				<input placeholder="请输入密码" maxlength="32" type="password" name="input" v-model="regForm.password"/>
			</view>
			<view class="cu-form-group">
				<view class="title">重复密码</view>
				<input placeholder="请重复输入密码" maxlength="32" type="password" name="input" v-model="regForm.repass"/>
			</view>
		</form>
		<view class="flex flex-direction im-login-btn">
			<button class="cu-btn lg bg-blue" @tap="login()">注册</button>
		</view>
		<view class="footer-version c-999">
			{{globalConfig.sysInfo.name ?? packData.name}} for {{packData.version}}
		</view>
	</view>
</template>

<script>
	import { useloginStore } from '@/store/login'
	import pinia from '@/store/index'
	import packageData from "../../package.json"
	const loginStore = useloginStore(pinia)
	export default {
		data() {
			return {
				regForm:{
					account:'',
					realname:'',
					password:'',
					repass:'',
					code:''
				},
				placeholder:'请输入账号：4-32个字符',
				forget:false,
				packData:packageData,
				globalConfig:loginStore.globalConfig
			}
		},
		watch:{
			forget(val){
			  if(val){
				this.regForm.password='123456';
			  }
			}
		},
		mounted() {
			let regauth=this.globalConfig.sysInfo.regauth ?? 0;
		    if(regauth==1){
				this.placeholder='请输入手机号';
		    }else if(regauth==2){
				this.placeholder='请输入邮箱账号';
		    }else if(regauth==3){
				this.placeholder='请输入手机号/邮箱';
		    }
		},
		methods: {
			handleInput(event) {
			  let value = event.detail.value;
			  let filteredValue = value.replace(/[\u4e00-\u9fa5]/g, '');
			  this.regForm.account = filteredValue;
			},
			sendCode(){
			  if(!this.regForm.account){
				uni.showToast({
					title: '请输入账号！',
					icon: "none"
				});
				return false;
			  }
			  let data={
				account:this.regForm.account,
				type:2
			  }
			  this.$api.LoginApi.sendCode(data).then((res)=>{
				  uni.showToast({
				  	title: res.msg,
				  	icon: "none"
				  });
			  })
			},
			login(){
				if(this.regForm.account==""){
					uni.showToast({
						title: '请输入账号！',
						icon: "none"
					});
					return false;
				}
				if(this.regForm.realname==""){
					uni.showToast({
						title: '请输入用户名或者昵称！',
						icon: "none"
					});
					return false;
				}
				if(this.regForm.password=="" && this.regForm.password.length<6 && this.regForm.password>16){
					uni.showToast({
						title: '请输入6-16位密码！',
						icon: "none"
					});
					return false;
				}
				if(this.regForm.password!=this.regForm.repass){
					uni.showToast({
						title: '两次密码输入不相同！',
						icon: "none"
					});
					return false;
				}
				this.$api.LoginApi.register(this.regForm).then(res => {
					if (res.code == 0) {
						setTimeout(()=>{
							uni.reLaunch({
								url: '/pages/login/index'
							})
						},2000)
					}
				})
				
			},
		}
	}
</script>

<style scoped>
	.login-logo {
		width: 180rpx;
		height: 180rpx;
		font-size: 80rpx;
		text-align: center;
		line-height: 120rpx;
		border-radius: 18rpx;
	}
	.footer-version{
		width:100%;
		text-align: center;
		position: fixed;
		bottom: 40rpx;
	}
	.remark-title{
		font-weight: 600;
	}
	.im-reg-btn{
		padding:30rpx;
	}
	.im-login-btn{
		padding:30rpx;
	}
	.forget{
		padding:30rpx;
		text-align: right;
	}
</style>
