import { defineStore } from 'pinia'
import LoginApi from '@/api/login.js'
export const useloginStore = defineStore({
  id: 'login', // id必填，且需要唯一
  state: () => {
    return {
      userInfo:uni.getStorageSync('userInfo') ? uni.getStorageSync('userInfo') : {},
	  globalConfig:uni.getStorageSync('globalConfig') ? uni.getStorageSync('globalConfig') : [],
	  appSetting:uni.getStorageSync('appSetting') ? uni.getStorageSync('appSetting') : [],
	  multiport:false
    }
  },
  // actions 用来修改 state
    actions: {
      login(userInfo) {
		  // 登陆后本地保存登录信息
      	uni.setStorageSync('userInfo', userInfo)
      	this.userInfo = userInfo;
		// 登陆后需要触发一次更新联系人
		uni.$emit('socketStatus',true);
		
      },
      logout() {
		 uni.removeStorageSync('userInfo');
		 uni.removeStorageSync("authToken");
		 this.userInfo = {}; 
		 uni.reLaunch({
		 	url: "/pages/login/index"
		 })
      },
	  getGlobalConfig(){
		  LoginApi.getSystemInfo().then((res)=>{
			  this.globalConfig=res.data;
			  uni.setStorageSync('globalConfig',res.data)
		  })
	  },
	  setAppSetting(setting){
		  uni.setStorageSync('appSetting', setting)
		  this.appSetting = setting
	  }
    }
})
