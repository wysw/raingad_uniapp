
<template>
	<view>
		<cu-custom bgColor="bg-main-bar" :isBack="true">
			<template #backText></template>
			<template #content>聊天信息</template>
		</cu-custom>
		<view>
			<view class="bg-white">
				<view class="user-list im-flex im-justify-content-start im-align-items-center im-a im-wrap" v-if="is_group<2">
					<view class="user-info mt-20" v-for="(item,index) in userList" :key="index" align="center">
						<image class="user-avatar" :src="item.userInfo.avatar" @tap="openChatDetail(item.userInfo)"></image>
						<view class="text-center user-name text-overflow">{{item.userInfo.displayName}}</view>
					</view>
					<view class="user-info mt-20" v-if="isAuth || is_group==0 || contact.setting.invite">
						<view class="user-opt radius-8" style='margin:auto' @tap='editUser(2)'>
							<view class="icon cuIcon-add f-24"></view>
						</view>
						<view class="f-11 mt-5">添加成员</view>
					</view>
					<view class="user-info mt-20" v-if="isAuth">
						<view class="user-opt radius-8" style='margin:auto' @tap='manageUser()'>
							<view class="icon cuIcon-move f-24"></view>
						</view>
						<view class="f-11 mt-5">移除成员</view>
					</view>
				</view>
				<navigator v-if="is_group==1 " class="mt-10" :url="`/pages/message/group/groupUser?group_id=${contact_id}`">
					<view class="text-center pb-15 pt-15 im-flex im-justify-content-center im-align-items-center">
						<text class="gui-list-title-text gui-list-one-line gui-primary-color">查看全部群成员</text>
						<text class="gui-list-title-desc gui-color-gray">{{groupUserCount}}人</text>
						<text class="cuIcon-right"></text>
					</view>
				</navigator>
				
				
			</view>
			<view class="cu-list menu mt-15 bg-white" v-if="is_group==1">
				<view class="cu-item"  @click="open">
					<view class="content padding-tb-sm">
						<view> 群聊名称 </view>
					</view>
					<view class="action">
						<view class="text-grey">{{contact.displayName}} <text class="cuIcon-right"></text></view>
					</view>
				</view>
				<view class="cu-item"  @click="openQr" v-if="contact.setting.invite">
					<view class="content padding-tb-sm">
						<view> 群二维码 </view>
					</view>
					<view class="action">
						<view class="text-grey"><text class="cuIcon-qr_code f-18"></text> <text class="cuIcon-right"></text></view>
					</view>
				</view>
				<view class="cu-item"  @tap="openModel('notice')">
					<view class="content padding-tb-sm">
						<view> 群公告 </view>
					</view>
					<view class="action" style="width:80%">
						<view class="text-grey im-flex im-justify-content-end">
							<view class="text-overflow notice-line">
								{{contact.notice ?? '暂无公告'}}
							</view>
							<text class="cuIcon-right"></text>
						</view>
					</view>
				</view>
				<view class="cu-item"  v-if="isAuth" @tap="openModel('manage')">
					<view class="content padding-tb-sm">
						<view> 群管理 </view>
					</view>
					<view class="action">
						<view class="text-grey"><text class="cuIcon-right"></text></view>
					</view>
				</view>
				<uni-popup ref="popup" type="dialog">
					<uni-popup-dialog mode="input" :value="contact.displayName" title="修改群名称" :duration="2000" :before-close="true" @close="closePop" @confirm="editGroupName">
						
					</uni-popup-dialog>
				</uni-popup>
			</view>
			
			<view class="cu-list menu mt-15 bg-white">
				<view class="cu-item">
					<view class="content padding-tb-sm">
						<view> 消息免打扰 </view>
					</view>
					<view class="action">
						<switch class="switch" @change="setIsNotice" :class="!contact.is_notice?'checked':''" :checked="!contact.is_notice?true:false"></switch>
					</view>
				</view>
				<view class="cu-item">
					<view class="content padding-tb-sm">
						<view> 置顶聊天 </view>
					</view>
					<view class="action">
						<switch class="switch" @change="setIsTop" :class="contact.is_top?'checked':''" :checked="contact.is_top?true:false"></switch>
					</view>
				</view>
			</view>
			<!-- #ifndef H5 -->
			<view class="cu-list menu mt-15 bg-white" @tap="modelName='setBg'">
				<view class="cu-item">
					<view class="content padding-tb-sm">
						<view> 设置当前聊天背景 </view>
					</view>
					<view class="action">
						<view class="text-grey"><text class="cuIcon-right"></text></view>
					</view>
				</view>
			</view>
			<!-- #endif -->
			
			<navigator class="mt-10" :url="`/pages/message/record?id=${contact_id}`">
			<view class="cu-list menu mt-15 bg-white">
				<view class="cu-item">
					<view class="content padding-tb-sm">
						<view> 查看聊天记录 </view>
					</view>
					<view class="action">
						<view class="text-grey"><text class="cuIcon-right"></text></view>
					</view>
				</view>
			</view>
			</navigator>
			<view class="cu-list menu mt-15 bg-white" v-if="is_group==1 && isAdmin" @tap="clearMessage">
				<view class="cu-item text-center delete-btn">
					<text class="c-orange">清空聊天记录</text>
				</view>
			</view>
			
			<view class="cu-list menu mt-15 bg-white" v-if="is_group==1" @tap="removeGroup">
				<view class="cu-item text-center delete-btn">
					<text class="c-red">{{isAdmin ? '解散群聊' : '退出群聊'  }}</text>
				</view>
			</view>
			<view class="parting-line-20"></view>
			<view class="cu-modal bottom-modal" :class="modelName=='notice'?'show':''">
				<view class="cu-dialog">
					<view class="cu-bar bg-white">
						<view class="action text-gray" @tap="closeModel">取消</view>
						<view class="action text-green" @tap="editNotice">保存</view>
					</view>
					<view class="notice-content">
						<textarea class="im-textarea" maxlength="-1" :disabled="!isAuth" v-model="contact.notice" placeholder="请输入公告内容..."></textarea>
					</view>
				</view>
			</view>
			<view class="cu-modal bottom-modal" :class="modelName=='setBg'?'show':''" @tap="modelName=''">
			<view class="cu-dialog" @tap.stop=''>
					<view class="cu-bar">
						<view class="action" >设置当前聊天背景</view>
						<view class="action cuIcon-close f-18" @tap="modelName=''"></view>
					</view>
					<view class="cu-list menu mb-15 bg-white">
						<view class="cu-item" @click="chooseImg()">
							<view class="content padding-tb-sm">
								<view>选取背景图片</view>
							</view>
							<view class="action">
								<view class="text-grey"><text class="cuIcon-right"></text></view>
							</view>
						</view>
					</view>
					<view v-if="bgInfo.image">
						<view><image :src="bgInfo.image" style="width:200px" mode="widthFix"></image></view>
						<button class="cu-btn bg-red mt-10" @tap="removeBg">移除背景图片</button>
					</view>
					<view class="cu-list menu mt-15 mb-15 bg-white">
						<view class="cu-item">
							<view class="content padding-tb-sm">
								<view>背景虚化</view>
							</view>
							<view class="action">
								<switch class="switch"  @change="setFilter" :class="bgInfo.filter?'checked':''" :checked="bgInfo.filter == true ? true :false"></switch>
							</view>
						</view>
					</view>
					<uni-notice-bar text="修改后重新进入聊天才能生效" class="mb-15"/>
				</view>
			</view>
			<view class="cu-modal bottom-modal" :class="modelName=='manage'?'show':''">
				<view class="cu-dialog">
					<view class="cu-bar bg-white">
						<view class="action text-gray" @tap="closeModel">取消</view>
						<view class="action text-green" @tap="saveManage">保存</view>
					</view>
					<view class="manage-content">
						<view class="cu-list menu mt-15 bg-white">
							<view class="cu-item">
								<view class="content padding-tb-sm">
									<view>仅群主和群管理员可以管理</view>
									<view class="text-gray text-sm"> 启用后，其他成员不能修改群名称，编辑公告等</view>
								</view>
								<view class="action">
									<switch class="switch" @change="setManage" :class="contact.setting.manage=='1'?'checked':''" :checked="contact.setting.manage=='1'?true:false"></switch>
								</view>
							</view>
							<view class="cu-item">
								<view class="content padding-tb-sm">
									<view>允许群成员邀请</view>
									<view class="text-gray text-sm">启用后，其他成员可以邀请其他人加入群聊</view>
								</view>
								<view class="action">
									<switch class="switch"  @change="setInvite" :class="contact.setting.invite=='1'?'checked':''" :checked="contact.setting.invite=='1'?true:false"></switch>
								</view>
							</view>
							<view class="cu-item">
								<view class="content padding-tb-sm">
									<view>允许成员查看历史消息</view>
									<view class="text-gray text-sm">启用后，新入群的成员可以查看所有的历史记录</view>
								</view>
								<view class="action">
									<switch class="switch"  @change="setHistory" :class="contact.setting.history=='1'?'checked':''" :checked="contact.setting.history=='1'?true:false"></switch>
								</view>
							</view>
							<view class="cu-item">
								<view class="content padding-tb-sm">
									<view>允许添加群成员为好友</view>
									<view class="text-gray text-sm">启用后，成员可以互相查看资料并添加为好友或发消息</view>
								</view>
								<view class="action">
									<switch class="switch"  @change="setProfile" :class="contact.setting.profile=='1'?'checked':''" :checked="contact.setting.profile=='1'?true:false"></switch>
								</view>
							</view>
							<uni-section title="群聊禁言" type="line">
								<radio-group class="block" @change="setSpeak">
									<view class="cu-form-group" v-for="item in radioList">
										<view class="title">{{item.label}}</view>
										<radio :class="contact.setting.nospeak==item.value?'checked':''" :checked="contact.setting.nospeak==item.value?true:false" :value="item.value.toString()"></radio>
									</view>
								</radio-group>
							</uni-section>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { useMsgStore } from '@/store/message';
	import pinia from '@/store/index';
	import { useloginStore } from '@/store/login';
	const userStore = useloginStore(pinia)
	const msgStore = useMsgStore(pinia)

	export default {
		components: {
		},
		data() {
			return {
				pageLoading: true,
				contact_id: null, //聊天id,
				is_group:0,
				groupUserCount:0,
				modelName:false,
				userList: [], //群成员
				allUser:[],
				userInfo:userStore.userInfo,
				chatRecordlist: [{
						text: '文本',
						icon: "icon-wenben",
						type: 'text'
		
					},
					{
						text: '图片',
						icon: "icon-zhaopian",
						type: 'image'
		
					}, {
						text: '文件',
						icon: "icon-wenjian",
						type: 'file'
		
					}, {
						text: '视频',
						icon: "icon-shipin",
						type: 'video'
		
					}, {
						text: '项目',
						icon: "icon-xiangmu_2",
						type: 'project'
		
					}, {
						text: '客户',
						icon: "icon-kehu",
						type: 'leads'
		
					},
				],
				radioList: [{
						label: "关闭",
						value: 0
					},
					{
						label: "仅管理员可发言",
						value: 1
					},
					{
						label: "仅群主可发言",
						value: 2
					},
				],
				isAuth: false, //判断自己是否时群管理或者群主
				contact: null, //联系人相关信息
				isAdmin:false, //如果为真，自己就是群主
				isManage: false, // 如果为真，自己就是管理
				user_ids: [],
				user:[],//全部群成员
				bgInfo:{
					image:'',
					filter:false
				}
			}
		},
		onShow() {
				this.getUserlist()
		},
		onLoad: function(options) {
			let bgInfo=uni.getStorageSync('chat-bg-info'+options.id);
			if(bgInfo){
				this.bgInfo=bgInfo;
			}
			this.is_group = options.is_group;
			this.contact_id = options.id;
			let contact=msgStore.getContact(this.contact_id);
			if(!contact){
				uni.showToast({
					title:'联系人不存在',
					icon:'none',
					duration:1500,
					complete:(res)=>{
						uni.reLaunch({
							url: '/pages/index/index'
						})
					}
				})
				return;
			}
			this.contact=contact;
			if(this.is_group==0){
				contact.userInfo={
					id:contact.user_id,
					account:contact.account,
					displayName:contact.displayName,
					avatar:contact.avatar
				}
				this.allUser.push(contact);
				this.userList.push(contact);
			}
		},
		methods: {
			openModel(model){
				this.modelName=model;
			},
			closeModel(){
				this.modelName=false;
			},
			saveManage(){
				if(!this.isAuth) return;
				this.$api.msgApi.groupSetting({
					id: this.contact.id,
					setting: this.contact.setting
				})
				this.modelName=false;
			},
			setManage(e){
				this.contact.setting.manage=e.detail.value ? '1' : '0';
			},
			setInvite(e){
				this.contact.setting.invite=e.detail.value ? '1' : '0';
			},
			setHistory(e){
				this.contact.setting.history=e.detail.value ? '1' : '0';
			},
			setProfile(e){
				this.contact.setting.profile=e.detail.value ? '1' : '0';
			},
			setSpeak(e){
				this.contact.setting.nospeak=e.detail.value;
			},
			setIsNotice(e){
				this.contact.is_notice=e.detail.value ? 0 : 1;
				this.$api.msgApi.isNoticeAPI({
					id: this.contact.id,
					is_group:this.contact.is_group,
					is_notice:this.contact.is_notice
				})
			},
			setIsTop(e){
				this.contact.is_top=e.detail.value ? 1 : 0;;
				this.$api.msgApi.setChatTopAPI({
					id: this.contact.id,
					is_group:this.contact.is_group,
					is_top:this.contact.is_top
				})
			},
			editNotice(){
				if(!this.isAuth) return;
				this.$api.msgApi.setNotice({
					id: this.contact.id,
					notice: this.contact.notice
				})
				this.modelName=false;
			},
			open() {
				this.$refs.popup.open()
			},
			openQr() {
				uni.navigateTo({
					url: '/pages/index/qrcode?group_id='+ this.contact.id
				})
			},
			editGroupName(e){
				this.$api.msgApi.editGroupName({id:this.contact.id,displayName:e}).then( res =>{
					this.contact.displayName=e;
					this.$refs.popup.close()
				})
			},
			closePop(){
				this.$refs.popup.close()
			},
			//移除群聊
			removeGroup() {
				// 如果是群主就解散群聊，否则就退出群聊
				let txt="退出群聊";
				if(this.isAdmin) txt="解散群聊";
				uni.showModal({
					title: '确定要'+txt+'吗?',
					success: e => {
						if (e.confirm) {
							if(this.isAdmin){
								this.$api.msgApi.removeGroup({id:this.contact.id}).then((res)=>{
									// 删除之后返回首页
									uni.reLaunch({
										url: '/pages/index/index'
									})
								})
							}else{
								this.$api.msgApi.removeUser({id:this.contact.id,user_id:this.userInfo.user_id}).then((res)=>{
									// 删除之后返回首页
									uni.reLaunch({
										url: '/pages/index/index'
									})
								})
							}
							
						}
					}
				});
				
			},
			clearMessage() {
				// 如果是群主就解散群聊，否则就退出群聊
				if(!this.isAdmin) {
					uni.showToast({
						title:'无权操作',
						icon:'none'
					})
				};
				uni.showModal({
					title: '清除后该群所有人的记录都会被删除，确定继续吗?',
					success: e => {
						if (e.confirm) {
							this.$api.msgApi.clearMessage({id:this.contact.id}).then((res)=>{
								uni.showToast({
									title:'清除成功',
									icon:'none'
								})
							})
						}
					}
				});
				
			},
			// 添加群成员
			editUser(type) {
				this.user_ids = this.allUser.map(item => item.user_id)
				if(this.contact.is_group==0){
					type=1
				}
				uni.navigateTo({
					url: '/pages/index/userSelection?type='+type+'&contact_id=' + this.contact.id
				})
			},
			// 管理群成员
			manageUser() {
				uni.navigateTo({
					url: '/pages/message/group/groupUser?group_id=' + this.contact.id
				})
			},
			// 跳转到聊天记录
			goChatRecord(type) {
				uni.navigateTo({
					url: '/package/message/pages/chatRecord/chatRecord?type=' + type + '&toContactId=' + this.contact_id + '&is_group=1'
				})
			},
			// 获取群成员列表
			getUserlist() {
				if(this.is_group==0) return;
				this.userList = []
				this.$api.msgApi.groupUserList({
					group_id: this.contact_id,
					limit:20,
				}).then(res => {
					this.user = res.data
					if (res.code !== 0) return
					// 判断自己是否为群主
					const admin=res.data.filter(item => item.role == 1 && item.userInfo.id== this.userInfo.user_id)
					if(admin.length) this.isAdmin=true;
					// 判断自己是否是群管理
					const manage=res.data.filter(item => item.role == 2 && item.userInfo.id== this.userInfo.user_id)
					if(manage.length) this.manage=true;
					// 判断是否有管理权限
					if(admin.length || manage.length) this.isAuth=true;
					this.allUser=JSON.parse(JSON.stringify(res.data));
					if (res.data.length > 18) {
						if (this.isAuth) {
							this.userList = res.data.splice(0, 18)
						}else if(this.contact.setting.invite){
							this.userList = res.data.splice(0, 19)
						} else {
							this.userList = res.data.splice(0, 20)
						}
					} else {
						this.userList = res.data
					}
					this.groupUserCount=res.count;
					this.pageLoading = false;
				})
			},
			// 打开联系人详情
			openChatDetail(item){
				if(this.userInfo.user_id==item.id) return;
				let friend=msgStore.getContact(item.id);
				if(this.contact.role<3 || this.contact.setting.profile=='1' || friend){
					uni.navigateTo({
						url:"/pages/contacts/detail?id="+item.id
					})
				}else{
					uni.showToast({
						title:'已开启用户隐私！',
						icon:'none'
					})
					return false;
				}
			},
			setFilter(e){
				this.bgInfo.filter=e.detail.value ? true : false;
				uni.setStorageSync('chat-bg-info'+this.contact.id,this.bgInfo)
			},
			chooseImg(){
				uni.chooseImage({
					count      : 1,
					sizeType   : ['compressed'],
					sourceType : ['album', 'camera'],
					success    : (res)=>{
						const tempFiles = res.tempFiles;
						tempFiles.forEach((item) => {
							uni.saveFile({
								tempFilePath:item.path,
								success:(res)=>{
									this.bgInfo.image=res.savedFilePath;
									uni.setStorageSync('chat-bg-info'+this.contact.id,this.bgInfo)
									uni.showToast({
										title:'设置成功，重新进入聊天后生效',
										icon:'none'
									})
								}
							})
					    })
					}
				});
			},
			removeBg(){
				this.bgInfo.image='';
				uni.setStorageSync('chat-bg-info'+this.contact.id,'')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.user-list{
		padding:0 20rpx 20rpx;
		.user-info{
			width:142rpx;
			height:130rpx;
			text-align:center;
			.user-avatar{
				width:100rpx;
				height:100rpx;
				border-radius: 16rpx;
			}
			.user-name{
				width:100rpx;
				margin:0 auto;
				font-size: 22rpx;
			}
			.user-opt{
				border:1px dashed #999;
				height:98rpx;
				width:98rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				.icon{
					color:#999 !important;
				}
				
			}
		}
		
	}

	.delete-btn{
		justify-content:center !important ;
	}
	
	.notice-content{
		width:100%;
		min-height:480rpx;
		.im-textarea{
			width:100%;
			min-height:480rpx;
			padding:20rpx;
			text-align:left;
		}
	}
	.notice-line{
		width:70%;
		text-align: right;
	}
</style>
