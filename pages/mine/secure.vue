<template>
	<view>
		<cu-custom bgColor="bg-main-bar" :isBack="true">
			<template #backText></template>
			<template #content>账号安全</template>
		</cu-custom>
		
		<view class="cu-list menu mt-10">
			<view class="cu-item" @tap="editAcc">
				<view class="content">
					<text class="cuIcon-settings text-grey"></text>
					<text>我的账号</text>
				</view>
				<view class="action">
					<text>{{userInfo.account}}</text>
					<text class="text-grey cuIcon-right"></text>
				</view>
			</view>
			<view class="cu-item"  @tap="modelName='show';editPass=true">
				<view class="content">
					<text class="cuIcon-lock text-green"></text>
					<text>修改密码</text>
				</view>
				<view class="action">
					<text class="text-grey cuIcon-right"></text>
				</view>
			</view>
			<view class="cu-item" v-if='!userInfo.is_auth'  @tap="modelName='show';editPass=false">
				<view class="content padding-tb-sm">
					<view>
						<text class="cuIcon-vip text-orange ml-5"></text> <text class="ml-10">认证账户</text></view>
					<view class="text-gray text-sm">
						<text class="cuIcon-infofill  ml-5 mr-10"></text> 验证账户的真实性，绑定后请使用新账户来登录！</view>
					</view>
				<view class="action">
					<text class="text-grey cuIcon-right"></text>
				</view>
			</view>
			
			<view class="padding flex flex-direction mt-40">
				<button class="cu-btn bg-red lg" @tap="logout()">注销登录</button>
			</view>
		</view>
		<view class="cu-modal bottom-modal" :class="modelName=='show'?'show':''"  @tap="modelName=''">
			<view class="cu-dialog" @tap.stop=''>
				<view class="cu-bar bg-white">
					<view class="action text-gray" @tap="modelName=''">取消</view>
					<view class="action text-green" @tap="save">保存</view>
				</view>
				<view class="manage-content mb-20">
					<view class="cu-list menu mt-15 bg-white">
						<view class="cu-form-group text-right" v-if="userInfo.is_auth">
							<view class="title">验证码</view>
							<input placeholder="输入验证码" name="input"  v-model="code" />
							<button class='cu-btn bg-green shadow cu-load'  :class="loading?'loading':''" :disabled="loading" @tap="sendCode(true)">发送验证码</button>
						</view>
						<template v-if="!editPass">
							<view class="text-gray m-15 text-left">
								<text class="cuIcon-infofill  ml-5 mr-10"></text> 验证账户的真实性，绑定后请使用新账户来登录！
							</view>
							<view class="cu-form-group text-right">
								<view class="title">新账号</view>
								<input placeholder="输入新的邮箱或者手机号" name="input" v-model="account" />
							</view>
							<view class="cu-form-group text-right">
								<view class="title">新账号验证码</view>
								<input placeholder="输入验证码" name="input" v-model="newCode" />
								<button class='cu-btn bg-green shadow cu-load' :class="loading?'loading':''" :disabled="loading" @tap="sendCode(false)">发送验证码</button>
							</view>
						</template>
						<template v-else>
							<view class="cu-form-group text-right" v-if="!userInfo.is_auth">
								<view class="title">原密码</view>
								<input placeholder="输入原来的密码" name="input" v-model="originalPassword" />
							</view>
							<view class="cu-form-group text-right">
								<view class="title">新密码</view>
								<input placeholder="输入新的密码" name="input" v-model="password" />
							</view>
							<view class="cu-form-group text-right">
								<view class="title">重复新密码</view>
								<input placeholder="重复输入新密码" name="input" v-model="repass" />
							</view>
						</template>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { useloginStore } from '@/store/login'
	import pinia from '@/store/index'
	const loginStore = useloginStore(pinia)
	export default {
		data() {
			return {
				userInfo:loginStore.userInfo,
				globalConfig:loginStore.globalConfig,
				modelName:'',
				code:'',
				account:'',
				newCode:'',
				password:'',
				originalPassword:'',
				repass:'',
				loading:false,
				editPass:false
			}
		},
		onShow() {
			
		}, 
		methods: {
			logout(){
				let client_id=uni.getStorageSync('client_id');
				this.$api.LoginApi.logout({client_id:client_id}).then(res => {
					if (res.code == 0) {
						loginStore.logout()
					}
				})
			},
			editAcc(){
				if(!this.userInfo.is_auth){
					uni.showToast({
					  title: '请先认证账户！',
					  icon: 'none'
					});
					return false;
				}
				this.modelName='show';
				this.editPass=false;
			},
			save(){
				if(this.code=='' && this.userInfo.is_auth){
					uni.showToast({
					  title: '请输入验证码',
					  icon: 'none'
					});
					return false;
				}
				if(this.editPass){
					if(this.password=='' || this.password.length<6 || this.password.length>16){
						uni.showToast({
						  title: '请输入6-16个字符串的密码',
						  icon: 'none'
						});
						return false;
					}
					if(this.password!=this.repass){
						uni.showToast({
						  title: '两次密码不一致',
						  icon: 'none'
						});
						return false;
					}
					let params = {
						password:this.password,
						code:this.code,
						originalPassword:this.originalPassword
					}
					this.$api.msgApi.editPassword(params).then(res=>{
						if(res.code==0){
							this.modelName = '';
						  this.password = '';
						  this.repass = '';
						  uni.showToast({
						    title: res.msg,
						    icon: 'none'
						  });
						}
					})
				}else{
					if(this.account==''){
						uni.showToast({
						  title: '请输入新的账号',
						  icon: 'none'
						});
						return false;
					}
					if(this.newCode==''){
						uni.showToast({
						  title: '请输入新账号的验证码',
						  icon: 'none'
						});
						return false;
					}
					let params = {
						account:this.account,
						code:this.code,
						newCode:this.newCode
					}
					this.$api.msgApi.editAccount(params).then(res=>{
						if(res.code==0){
						  this.modelName = '';
						  this.account = '';
						  this.code = '';
						  this.newCode = '';
						  uni.showToast({
						    title: "修改成功，请重新登陆",
						    icon: 'none'
						  });
						  
						}
					})
				}
			},
			sendCode(e){
			  let account=e ? this.userInfo.account : this.account;
			  let type = this.editPass ? 3 : 4;
			  if(account==''){
				uni.showToast({
				  title: '请输入新的账号',
				  icon: 'none'
				});
				return false;
			  }
			  this.loading = true;
			  this.$api.LoginApi.sendCode({account:account,type:type}).then((res)=>{
				  uni.showToast({
					title: res.msg,
					icon: "none"
				  });
				  this.loading=false;
			  })
			}
		}
	}
</script>

<style>
.cu-load {
    display: block;
    line-height: 68rpx;
    text-align: center;
}
</style>
