<template>
	<view>
		<cu-custom bgColor="bg-white">
			<template #backText>
				<view v-if="PageCur=='message' || PageCur=='contacts'" class="f-20 ml-10 mr-10" @tap="search()">
					<text class="cuIcon-search" style="margin-left: -10px;"></text>
				</view>
			</template>
			<template #content>{{PageName}}</template>
			<template #right>
				<view v-if="PageCur=='message'" class="f-20 ml-10 mr-10" @tap="modelName='add'">
					<text class="cuIcon-add f-28" id="add"></text>
				</view>
				
			</template>
		</cu-custom>
		<view>
			<meeting v-if="PageCur=='meeting'" v-show="PageCur=='meeting'"></meeting>
			<message v-show="PageCur=='message'"></message>
			<contacts v-show="PageCur=='contacts'" :TabCur="TabCur"></contacts>
			<compass v-show="PageCur=='compass'">e</compass>
			<mine v-show="PageCur=='mine'"></mine>
		</view>
		<view class="cu-bar tabbar bg-white shadow foot">
			<view class="action" @click="NavChange(item)" v-for="(item,index) in navList" :key="index" data-cur="message">
				<view class='cuIcon-cu-image'>
					<image :src="'/static/image/tabbar/' + [item.name] + [PageCur==item.name?'-active':''] + '.svg'"></image>
				    <view class="cu-tag badge" v-if="item.notice>0">{{item.notice}}</view>
				</view>
				<view :class="PageCur==item.name?'text-green':'text-black'">{{item.title}}</view>
			</view>
		</view>
		<view class="add-modal" :class="modelName=='add' ? 'show' : 'none'" @tap="modelName=''" >
			<view class="add-dialog" :style="{top:top+20+'px'}">
				<view class="add-item" @tap="initContacts();">
					<view class="content padding-tb-sm">
						<text class="cuIcon-refresh"></text>
						<text class="text">更新消息</text>
					</view>
				</view>
				<view class="add-item" @tap="addFriend()" v-if='globalConfig.sysInfo.runMode==2'>
					<view class="content padding-tb-sm">
						<text class="cuIcon-friendadd"></text>
						<text class="text">添加朋友</text>
					</view>
				</view>
				<view class="add-item" @tap="addGroup()">
					<view class="content padding-tb-sm">
						<text class=" cuIcon-friend"></text>
						<text class="text">创建群聊</text>
					</view>
				</view>
				<view class="add-item" @tap="scan()">
					<view class="content padding-tb-sm" style="text-align: left;">
						<text class=" cuIcon-scan mr-5"></text>
						<text class="text">扫 一 扫</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import message from '@/pages/message';
	import meeting from '@/pages/meeting';
	import contacts from '@/pages/contacts';
	import compass from '@/pages/compass';
	import mine from '@/pages/mine';
	import { storeToRefs } from 'pinia';
	import { useMsgStore } from '@/store/message';
	import { useloginStore } from '@/store/login';
	import pinia from '@/store/index'
	import scan from '@/common/scan.js'
	const msgStore = useMsgStore(pinia)
	const loginStore = useloginStore(pinia)
	const { unread,sysUnread } = storeToRefs(msgStore);
	export default {
		components: {
			message,
			contacts,
			compass,
			mine,
			meeting
		},
		data() {
			let navList=[
				{
					name:'meeting',
					title:'会议',
				},
				{
					name:'message',
					title:'消息',
					notice:unread
				},
				{
					name:'contacts',
					title:'通讯录',
					notice:sysUnread
				}
			]
			let compass={
				name:'compass',
				title:'探索',
				notice:0
			};
			if(loginStore.globalConfig && loginStore.globalConfig.compass){
				if(loginStore.globalConfig.compass.status==1){
					navList.push(compass);
				}
			}
			let mine={
				name:'mine',
				title:'我的',
				notice:0
			}
			navList.push(mine);
			return {
				globalConfig:loginStore.globalConfig,
				PageCur: 'message',
				PageName: '消息',
				TabCur:0,
				modelName:false,
				navList:navList,
				top:10
			}
		},
		onBackPress(options) {  
			if (getCurrentPages().length > 1) {
				return false;
			}
			try {
				const main = plus.android.runtimeMainActivity();
				main.moveTaskToBack(false); // 将任务移动到后台
				return true; // 拦截返回按键，防止退出应用
			} catch (e) {
				return false; // 出现错误时允许默认返回行为
			}
		},
		mounted(){
			// #ifndef MP
				uni.hideTabBar();
			// #endif	
			this.initContacts();
			// 监听ws状态,如果重新连接了,要更新联系人
			uni.$on('socketStatus',(e)=>{
				if(e){
					console.log('触发了一次');
					this.initContacts();
				}
			})
			uni.$off('initContacts');
			uni.$on('initContacts',(e)=>{
				this.initContacts();
			})
			let query = this.$util.getQuery(this).select("#add").boundingClientRect();
			query.exec((res)=> {
				let top = res[0].top;
				let height = res[0].height;
				this.top = top+height
			});
		},
		methods: {
			closeModel(){
				this.modelName=false;
			},
			scan(){
				scan.scanQr();
			},
			NavChange: function(item) {
				this.PageCur = item.name
				this.PageName = item.title
			},
			showContacts(){
				this.TabCur==1 ? this.TabCur=0 :this.TabCur=1
			},
			initContacts(){
				this.modelName='';
				this.$api.msgApi.initContacts().then(res => {
					// 设置消息未读数和系统消息未读数
					msgStore.sysUnread=res.count;
					msgStore.initContacts(res.data);
				})
			},
			addGroup(){
				uni.navigateTo({
					url: '/pages/index/userSelection?type=1'
				})
			},
			addFriend(){
				uni.navigateTo({
					url: '/pages/contacts/search'
				})
			},
			search(){
				const type = this.PageCur=="message" ? 1 : 2;
				uni.navigateTo({
					url: '/pages/index/search?type='+type
				})
			}
		}
	}
</script>

<style scoped lang="scss">
	.add-modal{
		position: fixed;
		top: 0;
		right: 0;
		z-index: -99999;
		
		.add-dialog{
			display: flex;
			flex-direction: column;
			background-color: #4f4f4f;
			color: #fff;
			border-radius: 10rpx;
			justify-content: space-around;
			align-items: center;
			position: fixed;
			right: 10rpx;
			width: 240rpx;
			padding:20rpx;
			.add-item{
				.text{
					margin-left: 10rpx;
				}
			}
		}
		
		.add-dialog::after {
			content: "";
			top: -10rpx;
			transform: rotate(45deg);
			position: absolute;
			display: inline-block;
			overflow: hidden;
			width: 30rpx;
			height: 30rpx;
			right: 20rpx;
			left: initial;
			background: #4f4f4f;
		}
	}
	.show{
		position: fixed;
		top: 0;
		z-index: 9999;
		height: 100vh;
		width: 100vw;
		opacity:1
	}
	.none{
		position: fixed;
		top: 0;
		right: 0;
		z-index: -99999;
		opacity: 0;
	}
</style>