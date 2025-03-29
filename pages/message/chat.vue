
<template>
	<view>
		<cu-custom bgColor="bg-white" :isBack="true" class="cu-header">
			<template #backText>
				<view class="back-unread" v-if="unread>0 && unread<100">{{unread}}</view>
				<view class="back-unread" v-if="unread>100">99+</view>
			</template>
			<template #content>
				<view class="im-flex im-justify-content-center im-align-items-center">
					<statusPoint v-if="is_group==0 && contact.is_online==1 && globalConfig.chatInfo.online==1" type="success"></statusPoint><text class="text-overflow">{{contact.displayName}}</text>
					<text v-if="is_group==1">({{groupInfo.groupUserCount ?? 0}})</text>
				</view>
			</template>
			<template #right>
				<view class="cuIcon-more mr-10 f-16" v-if="is_group!=2" @tap="openDetails"></view>
			</template>
		</cu-custom>
		<!-- <uni-notice-bar show-icon scrollable  showClose text="请注意防骗" style="margin: 0;z-index:1000;position: absolute;"/> -->
		<scroll-view class="scroll-view-body blur-background" :class="bgInfo.filter ? 'filter-blur' : ''" ref="scrollView" scroll-y="true" :scroll-anchoring="true" :scroll-top="scrollTop"  @scroll="scrollChat" :style="{height:scrollHeight+'rpx',position:'fixed',bottom:(is_group==2 ? 0 : bottomHeight)+'px',backgroundImage:'url('+bgInfo.image+')'}">
		<view class="cu-chat" :style="{paddingBottom:paddingB+'px'}" @click="closeInput" id="more-oprate">
			<uni-load-more :status="loading" v-if="page!=1"></uni-load-more>
			<template v-for="(item,index) in messageList" :key="index" :id="'chatItem_'+index">
				<view class="cu-info"  v-if="item.type=='event'">{{item.content}} <text class="c-primary" v-if="item.is_undo==1 && (getTime() - item.sendTime) < globalConfig.chatInfo.redoTime*1000" @tap="reEdit(item.oldContent ?? '')">重新编辑</text></view>
				<template v-else>
					<view class="cu-item" :class="[item.fromUser.id==user.user_id ? 'im-rows-reverse self im-justify-content-start' : '' ]">
						<im-user :info="item.fromUser" :profile="isProfile" @longpress="at(item.fromUser)"></im-user>
						<view class="main im-wrap" :class="[item.fromUser.id==user.user_id ? 'im-rows-reverse' : '' ]" @touchstart="moreOption($event,item,index)"  @touchmove="ListTouchMove" @touchend="endTimer" @tap="dblclick(item)">
							<view class="message-head f-12 c-666">
								<uni-tag class="mr-5"  v-if="item.role<3 && item.fromUser.id!=user.user_id" :type="item.role==1 ? 'warning' : 'primary'" size="mini" :text="item.role==1 ? '群主' : '管理员'"></uni-tag>
								<text v-if="item.fromUser.id!=user.user_id" :class="bgInfo.image ? 'c-white' : ''">{{item.fromUser.realname}} &nbsp;&nbsp;</text>
								<text class="f-11" :class="bgInfo.image ? 'c-white' : 'c-999'">{{sendTime(item.sendTime)}}</text>
							</view>
							<view class="im-flex im-rows-reverse self im-align-items-end" :id="'msg_id_'+item.msg_id">
								<!-- 文字消息 -->
								<view v-if="item.type=='text'">
									<view class="content shadow"  :class="[item.fromUser.id==user.user_id ? 'bg-light-green' : '' ]">
										<mp-html container-style="overflow: hidden;display:inline;white-space: pre-wrap" :content="emojiToHtml(item.content)"/>
									</view>
									<view class="message-quote radius-6" v-if="item.extends && item.extends.content">
										{{item.extends.content}}
									</view>
								</view>
								<!-- 图片消息 -->
								<template v-else-if="item.type=='image'">
									<im-image :src="item.content" :info="item.extends" @showImgs="showImgs"></im-image>
								</template>
								
								<!-- 语音消息 -->
								<view v-else-if="item.type=='voice'" class="im-voice-msg im-flex im-rows im-nowrap im-align-items-center radius-20" 
								:class="[index == playIndex ? 'linear-green' : '', item.fromUser.id==user.user_id ? 'im-rows-reverse' : '' , ]" :data-voice="item.content" :data-index='index' @tap='playVoice' 
								:style="{'width':(item.extends.duration*3)+'px'}">
									<text class="f-16 cuIcon-subscription rotate45" :class="[index == playIndex ? 'c-white' : '',item.fromUser.id==user.user_id ? 'rotate225' : '']"></text>
									<text class="im-voice-msg-text" :class="[index == playIndex ? 'c-white' : '']">{{item.extends.duration}} "</text> 
								</view>
								<!-- 视频消息 -->
								<template v-else-if="item.type=='video'" >
									<view class='course-video' :style="(item.extends && item.extends.width) ? $util.imageCoverStyle(item.extends.width,item.extends.height) : ''">
										<view class="relative-shadow" @tap="handlePlay(item)">
											<view class="cuIcon-video icon-center f-28 c-white"></view>
											<view class="video-duration f-10 c-white" v-if="item.extends && item.extends.duration">{{$util.videoFormatTime(item.extends.duration)}}</view>
										</view>
										<im-image v-if="item.extends" :src="item.extends.poster" :info="item.extends"></im-image>
									</view>
								</template>
								<!-- 文件消息 -->
								<view v-else-if="item.type=='file'">
									<view class="file-card bg-white radius-10 im-flex im-justify-content-start pd-10 im-align-items-center"  @tap.stop="previewFile(item)">
										<image :src="item.extUrl" style="width:64rpx;height:80rpx"></image>
										<view class="im-flex im-columns ml-10">
											<view class="text-overflow file-name">{{item.fileName}}</view>
											<view class="text-gray file-size f-12">{{fileSize(item.fileSize)}}</view>
										</view>
									</view>
								</view>
								<!-- 音视频消息 -->
								<view v-else-if="item.type=='webrtc'" @tap="calling(item.extends.type)" class="im-voice-msg im-flex im-rows im-nowrap im-align-items-center radius-20" :class="[item.fromUser.id==user.user_id ? 'im-rows-reverse' : '' , ]">
									<text class="f-16" :class="[item.extends.type == 1 ? 'cuIcon-record' : 'cuIcon-dianhua',item.fromUser.id==user.user_id ? 'rotate180' : '']"></text>
									<text class="im-voice-msg-text">{{item.content}}</text> 
								</view>
								<!-- 位置消息 -->
								<view v-else-if="item.type=='location'" @tap="openLocation(item.extends)" class="im-location-msg im-flex im-rows im-nowrap im-align-items-center radius-8 pd-10">
									<view class="f-24 cuIcon-location pr-5"></view>
									<view>
										<view class="f-14 mb-5">{{item.content}}</view>
										<view class="c-999 f-12">{{item.extends && item.extends.address}}</view> 
									</view>
									
								</view>
								<!-- 名片消息 -->
								<view v-else-if="item.type=='contact'" @tap="openContact(item.extends)" class="im-contact-msg radius-8 pt-10 pr-10 pl-10 pb-5">
									<view class="im-flex im-rows im-nowrap im-align-items-center">
										<view class='cu-avatar mr-10 radius'  :style="[{backgroundImage:'url('+item.extends.avatar+')'}]">
										</view>
										<view class="c-333">{{item.extends.displayName}}</view>
									</view>
									<hr class="mt-10 c-999">
									<view class="c-666 f-10">
										个人名片
									</view>
								</view>
								<!-- 动态表情消息 -->
								<template v-else-if="item.type=='emoji'">
									<image :src="item.content" class="radius" mode="aspectFit" @tap="showImgs"  :data-img="item.content" style="width:300rpx;height:300rpx"></image>
								</template>
								<!-- 其他消息 -->
								<imItem v-else :item="item" :index="index" :isSelf="true"></imItem>
								<view class="mt-10 mr-5 f-20" v-if="item.fromUser.id==user.user_id">
									<view class="cuIcon-icloading icon-spin c-999" v-if="item.status=='going'"></view>
									<view class="cuIcon-infofill c-red" v-if="item.status=='failed'" @tap="reSend(item)"></view>
									<view class="f-16" v-if="item.is_group==0 && item.status!='going'" :class="item.is_read ? 'text-green cuIcon-roundcheckfill' : 'c-999 cuIcon-roundcheck'"></view>
								</view>
							</view>
						</view>
					</view>
				</template>
			</template>
			
		</view>
		</scroll-view>
		<view id="im-input" v-if="is_group!=2">
			<imInput @send="sendMessage" @setPad="setPad" :boxStatus="boxStatus" :contact="contact" ref="imInput"></imInput>	
		</view>
		<view class="add-modal" :class="modelName=='moreOpt'?'show':'none'" @tap="modelName=''">
			<view class="add-dialog" :style="popStyle" v-if="curMsg">
				<view class="add-dialog-tail" :style="tailStyle"></view>
				<view class="add-item" @tap="undoMsg()" v-if="( (getTime() - curMsg.sendTime < globalConfig.chatInfo.redoTime*1000 && curMsg.fromUser.id==user.user_id) || contact.role<3 ) 
						&& curMsg.type!=='webrtc'">
					<text class="cuIcon-repeal"></text>
					<view>撤回</view>
				</view>
				<view class="add-item" @tap="copyMsg()" v-if="['text','image','video','file'].includes(curMsg.type)">
					<text class="cuIcon-copy"></text>
					<view>复制{{copyTxt}}</view>
				</view>
				<view class="add-item" @tap="colEmoji()" v-if="curMsg.type=='emoji'">
					<text class="cuIcon-emoji"></text>
					<view>存表情</view>
				</view>
				<view class="add-item" @tap="forwardMsg()" v-if="curMsg.type!=='voice' && curMsg.type!=='webrtc' && curMsg.type!=='money' ">
					<text class="cuIcon-forward"></text>
					<view>转发</view>
				</view>
				<view class="add-item" @tap="quoteMsg()"  v-if="curMsg.type!=='webrtc' && curMsg.type!=='money' ">
					<text class="cuIcon-tag"></text>
					<view>引用</view>
				</view>
				<view class="add-item" @tap="delMsg()" v-if="globalConfig.chatInfo.dbDelMsg && curMsg.fromUser.id==user.user_id">
					<text class="cuIcon-delete"></text>
					<view>删除</view>
				</view>
			</view>
		</view>
		<view class="cu-modal bottom-modal" :class="modelName=='copyModel'?'show':''">
			<view class="cu-dialog">
				<view class="cu-bar bg-white">
					<view class="action text-gray" @tap="modelName=''">取消</view>
					<view class="action text-green" @tap="copyMsg()">复制</view>
				</view>
				<scroll-view scroll-y="true" :style="{height:scrollHeight+'rpx'}">
					<view class="pd-20 text-container">
						<mp-html :content="curMsg.content"></mp-html>
					</view>
				</scroll-view>
			</view>
		</view>
		<view class="at-fixed-item" v-if="atCount" @tap="openAtModel" :style="{bottom:130+inlineTools+'rpx'}">
			有{{atCount}}人提到我
		</view>
		<view class="at-fixed-item" v-else-if="!isBottom" @tap="scrollToBottom()" :style="{bottom:130+inlineTools+'rpx'}">
			回到底部
		</view>
		<view class="cu-modal bottom-modal" :class="modelName=='atModel'?'show':''" @tap="modelName=''">
			<view class="cu-dialog" v-if="modelName=='atModel'">
				<view class="cu-bar bg-white">
					<view class="action">提到我的人</view>
					<view class="action text-green">已读</view>
				</view>
				<scroll-view scroll-y="true" :style="{height:scrollHeight+'rpx'}"  @tap.stop=''>
					<view class="cu-chat" style="text-align: left;">
						<view class="cu-item"  v-for="(item,index) in atMsgList" :key="index" style="padding-bottom: 10rpx;">
							<im-user :info="item.fromUser" :profile="isProfile" @longpress="at(item.fromUser)"></im-user>
							<view class="main im-wrap" @tap="dblclick(item)">
								<view class="f-12 c-666" style="width:100%;margin-bottom: 6rpx;">{{item.fromUser.realname}}<text class="text-gray"> &nbsp;&nbsp; {{$util.date("Y-m-d H:i:s",item.sendTime)}} </text></view>
								<!-- 文字消息 -->
								<view>
									<view class="content shadow" v-if="item.type=='text'">
										<mp-html container-style="overflow: hidden;display:inline;white-space: pre-wrap" :content="emojiToHtml(item.content)"/>
									</view>
									<view class="message-quote radius-6 align-left" v-if="item.extends && item.extends.content">
										{{item.extends.content}}
									</view>
								</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
		<!-- 文件预览 -->
		<view class="cu-modal bottom-modal" :class="modelName=='preview'?'show':''" @tap="modelName=''">
			<view class="cu-dialog" v-if="modelName=='preview'">
				<view class="cu-list menu bg-white">
					<view class="cu-item" @tap="preview(1)" >
						<view class="content padding-tb-sm">
							<text class="text-center">本地预览(需下载)</text>
							<view class="text-gray text-sm">需下载，仅支持office类型文件</view>
						</view>
					</view>
					<view class="cu-item" @tap="preview(2)">
						<view class="content padding-tb-sm">
							<text>在线预览</text>
							<view class="text-gray text-sm">支持常用的文件和文档</view>
						</view>
					</view>
					</view>
			</view>
		</view>
	</view>
</template>

<script>
	const innerAudioContext = uni.createInnerAudioContext();
	import imInput from '@/components/message/im-input.vue';
	import imItem from '@/components/message/im-item.vue';
	import imImage from '@/components/message/im-image.vue';
	import statusPoint from '@/components/status.vue';
	import imUser from '@/components/im-user.vue';
	import emoji from '@/utils/emoji.js'
	import { chat } from '@/mixins/chat.js'
	import { useloginStore } from '@/store/login';
	import { useMsgStore } from '@/store/message';
	import { storeToRefs } from 'pinia';
	import pinia from '@/store/index'
	const msgStore = useMsgStore(pinia)
	const {newMessage,msgList,getContact,appendMsg,checkMsg,unread} = storeToRefs(msgStore);
	const userStore = useloginStore(pinia)
	const getTime = () => {
	  return new Date().getTime();
	};
	export default {
		components: {
			imInput,
			imItem,
			imUser,
			statusPoint,
			imImage
		},
		mixins:[chat],
		data() {
			return {
				user:userStore.userInfo,
				contact:{},
				is_group:0,
				boxStatus:0,
				paddingT:0,
				video:'',
				videoUrl: '',
				InputBottom: 0,
				player    : null,
				playIndex : -1,
				emojiMap:[],
				fileExt:[],
				page:1,
				limit:10,
				moreData:true, //是否有更多数据
				newMessage:newMessage,
				messageList:msgList,
				newheight:0,
				scrollTop:0,
				loading:'more',
				loadLock:false,
				scrollHeight:0,  //聊天界面滚动高度，移除原来的计算属性
				paddingB:0,
				contact_id:0,
				bottomHeight:50,
				globalConfig:userStore.globalConfig,
				modelName:'',
				curMsg:'',
				curIndex:0,
				isSending:false,
				copyTxt:'',
				wsData:null,
				timer:null,
				lastTapDiffTime: 0,
				isProfile:false,
				islongPress:false,
				listTouchStart:0,
				groupInfo:{
					groupUserCount:0
				},
				atMsgList:[],
				atCount:0,
				unread:unread,
				isBottom:true,
				bgInfo:{
					image:'',
					filter:10
				},
				tailStyle: { // 小尾巴的样式
					left: '0px',
					top: '0px',
				},
				popStyle:{ //长按消息菜单
					left: '0px',
					top: '0px',
					width:'0px',
					height:'0px'
				}
			};
		},
		watch:{
			newMessage(val){
				if(val.toContactId==this.contact.id && val.fromUser.id!=this.user.user_id){
					this.$api.msgApi.setMsgIsRead({
						toContactId: this.contact.id,
						is_group: this.contact.is_group,
						messages: val,
						fromUser: val.fromUser.id,
					});
				}
				this.isBottom ? this.scrollToBottom() : '';
			}
		},
		onLoad(options){
			// 清空消息列表,避免串台
			msgStore.msgList=[];
			let bgInfo=uni.getStorageSync('chat-bg-info'+options.id);
			if(bgInfo){
				this.bgInfo=bgInfo;
			}
			// 获取当前联系人信息
			let data=msgStore.getContact(options.id);
			if(!data){
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
			if(data.is_group==1 && (data.role<3 || data.setting.profile=='1')){
				this.isProfile=true;
			}
			this.contact = data;
			this.contact_id=options.id;
			this.is_group = data.is_group;
			this.getMessageList();
			if(data.is_group==1){
				this.getGroupInfo();
			}
			let unread=msgStore.unread;
			// 如果有未读,就将未读的角标置为0
			if(data.unread>0){
				let contacts=msgStore.updateContacts({
					id:options.id,
					unread:0
				});
				msgStore.unread = unread - data.unread;
			}
			// 监听消息更新请求
			uni.$on('getPositonsOrder',(res) => {
				let message=res.data;
				switch (res['type']) {
					//处理消息已读,将本地的未读消息修改为已读状态
					case "isRead":
						for (let i = 0; message.length > i; i++) {
					        const data = {
					          id: message[i]["id"],
					          is_read: 1
					        };
					        this.updateMessage(data);
					     }
						break;
					case "readAll":
						// 如果某人阅读了消息，全部置为已读
						if(message.toContactId==this.contact.id && this.is_group==0){
							this.messageList.forEach((item)=>{
								item.is_read=1;
							})
						}
						break;
					//上线、下线通知
					case "isOnline":
						if(message.id==this.contact.id){
							this.contact.is_online=message.is_online;
						}
						break;
					// 撤回消息
					case "undoMessage":
						if(message.from_user==this.user.user_id && message.isMobile==1 && getTime()-message.sendTime<this.globalConfig.chatInfo.redoTime*1000){
							return false;
						}
					    this.updateMessage(message);
					    break;
					// 删除消息
					case "delMessage":
						this.messageList = this.messageList.filter((item)=>{
							return item.id!=message.id;
						})
					    break;
					// 更新消息
					case "updateMessage":
					    this.updateMessage(message);
					    break;
					case "atMsgList":
					case "simple":
					case "group":
					case "webrtc":
					case "removeUser":
					case "clearMessage":
					case "delMessage":
						let routes = getCurrentPages();
						let curParam ={};
						let routePages = routes[routes.length - 1].route;
						let pages = 1;
						// 如果是音视频聊天页面的话就需要上一个页面的参数
						if(routePages=='pages/message/call'){
							pages = 2;
						}
						// #ifdef MP-WEIXIN
						curParam = routes[routes.length - pages].options ?? '';
						// #endif
						// #ifdef APP-PLUS
						curParam = routes[routes.length - pages].$page.options ?? '';
						// #endif
						// 如果是h5需要单独去获取url的参数
						// #ifdef H5
						let url = location.href;
						// 如果是音视频聊天页面的话就不要写入消息
						if(url.indexOf('pages/message/call')!==-1){
							return;
						}
						curParam=this.$util.parseUrl(url);
						// #endif
						if(res['type']=='atMsgList'){
							if(message.toContactId==curParam.id){
								this.atMsgList=message.list;
								this.atCount=message.count;
							}
							return;
						}
					    
						// 如果是删除的本人和当前群聊,返回到列表页
						if(res['type']=='removeUser'){
							if(message.group_id==curParam.id && message.user_id == this.user.user_id){
								uni.showToast({
									title:'您已被移出群聊！',
									icon:'none',
									complete: () => {
										uni.reLaunch({
											url: '/pages/index/index'
										})
									}
								})
								
							}
							return;
						}
						
						if(res['type']=='clearMessage'){
							if(message.group_id==curParam.id){
								this.messageList=[];
								msgStore.updateContacts({
									id:message.group_id,
									lastContent:''
								})
							}
							return;
						}
						if(res['type']=='delMessage'){
							if(message.group_id==curParam.id){
								this.messageList = this.messageList.filter(item => item.id != message.id)
							}
							return;
						}
						if(message.type=='webrtc'){
							if(!['calling','hangup','otherOpt'].includes(message.extends.event)){
								return false;
							}
							if(message.extends.event=='calling'){
								this.wsData=message;
							}
							let code=parseInt(message.extends.code);
								if([902,903,904,905,906,907].includes(code)){
								let wsData=this.wsData || message;
								wsData.content=message.content;
								message=wsData;
							}
						}
						let isAppend=false;
						if(message.is_group==1){
							if(message.toUser==curParam.id){
								isAppend=true;
							}
						}else{
							// 如果是当前的聊天房间，才可以进行消息新增
							if(message.toContactId==curParam.id || (message.fromUser.id==this.user.user_id && message.toUser==curParam.id)){
								isAppend=true;
							}
						}
						if(isAppend){
							msgStore.checkMsg(message);
							msgStore.appendMsg(message);
							let contact=msgStore.getContact(this.contact_id,message);
							let at=contact.is_at;
							if(message.fromUser.id!=this.user.user_id){
								// 将姓名显示为备注信息的新名称
								let fromContact=msgStore.getContact(message.fromUser.id,null);
								if(fromContact){
									message.fromUser.realname=fromContact.displayName;
								}
							}
							// 检查当前聊天的新消息是否有@数据,有的话直接清楚列表中的提醒
							if(message.at.includes(this.user.user_id)){
								msgStore.msgAt-=1;
								at= contact.is_at-1;
							}
							msgStore.updateContacts({
								id:curParam.id,
								unread:0,
								is_at:at
							});
						}
						// this.scrollToBottom();
						break;
				}
			})
		},
		onUnload(){
			// 聊天记录置为空
			msgStore.msgList=[];
			// 停止所有声音播放
			innerAudioContext.stop();
			uni.$off("socketStatus");
		},
		beforeDestroy(){
			uni.$off("socketStatus");
		},
		// 所有聊天页面都返回首页，避免层级过深
		onBackPress(options) {
			this.InputBottom=0;
			uni.switchTab({
				url: '/pages/index/index'
			})
			return true;
		},
		onShow(){
			// 检测ws是否还在线
			this.socketIo.send({type:'ping'});
		},
		created: function(){
			let emojiMap=[];
			// 解析所有表情
			emoji.forEach(function (item) {
				let child=item.children;
			  if(child.length>0){
				  child.forEach(function (val) {
					  let name=val.name;
					  let src=val.src;
					  emojiMap[name]=src;
				  })
			  }
			});
			this.emojiMap=emojiMap;
			innerAudioContext.onPlay(() => {console.info('play');});
			innerAudioContext.onEnded(() => {
				innerAudioContext.stop();
				this.playIndex = -1;
			});
			innerAudioContext.onError((E)=>{console.info(E);});
		},
		mounted () {
			// 重新链接就更新消息列表
			uni.$on('socketStatus',(e)=>{
				if(e){
					this.page=1,
					this.getMessageList();
					if(this.is_group==1){
						this.getGroupInfo();
					}
				}
			})
			this.computeHeight();
		},
		methods: {
			computeHeight(){
				let sys = uni.getSystemInfoSync();
				let winWidth = sys.windowWidth;
				let winrate = 750/winWidth;
				let bottomHeight=uni.upx2px(100);
				this.bottomHeight=bottomHeight;
				const query=this.$util.getQuery(this);
				query.select('.cu-header').boundingClientRect();
				query.exec(data => {
					this.paddingT=data[0].height;
					// #ifdef H5
					let winHeight =parseInt((sys.windowHeight - this.navBarHeight - this.paddingT)*winrate);
					// #endif
					
					// #ifdef APP-PLUS
					let winHeight =parseInt((sys.windowHeight - (this.inlineTools + this.paddingT+bottomHeight))*winrate);
					// #endif
					
					// #ifndef H5 || APP-PLUS
					this.bottomHeight+=this.inlineTools;
					// 微信小程序需要减去状态栏+底部导航栏+底部横线
					let winHeight =parseInt((sys.windowHeight-(this.inlineTools + this.paddingT + this.navBarHeight))*winrate)
					// #endif
					if(this.is_group==2){
						this.scrollHeight = winHeight+100;
					}
					this.scrollHeight = winHeight;
				});
			},
			// 长按头像@人
			at(item){
				if(this.contact.is_group==0 || this.user.user_id==item.id){
					return;
				}
				item.user_id=item.id;
				this.$refs.imInput.setAtList(item);
			},
			openAtModel(){
				this.modelName='atModel';
				let msgAt=msgStore.msgAt;
				let curAt=this.atCount;
				this.$api.msgApi.readAtMsg({toContactId:this.contact_id}).then(res => {
					if(res.code==0){
						msgStore.msgAt=msgAt-curAt;
						msgStore.updateContacts({
							id:this.contact_id,
							is_at:0
						})
						this.atCount=0;
					}
				})
			},
			calling(type){
				this.$refs.imInput.calling(parseInt(type));
			},
			endTimer() {
			    clearTimeout(this.timer);
				setTimeout(() => {
					this.islongPress = false
				}, 200)

			},
			 // 双击
			dblclick(item) {
				const _this = this;
				// 当前时间
				const curTime = new Date().getTime();
				// 上次点击时间
				const lastTime = _this.lastTapDiffTime;
				// 更新上次点击时间
				_this.lastTapDiffTime = curTime;
				// 两次点击间隔小于300ms, 认为是双击
				const diff = curTime - lastTime;
				if (diff < 300) {
					this.curMsg=item;
					this.modelName='copyModel';
				}  
			},
			getTime(){
			  return new Date().getTime();
			},
			setPad(padding){ //设置聊天内容的地步边距
				this.paddingB=padding;
				this.scrollToBottom();
			},
			// 获取群聊信息
			getGroupInfo(){
				this.$api.msgApi.groupInfo({
					group_id: this.contact_id,
				}).then(res => {
					if(res.code==0){
						this.groupInfo=res.data;
					}
				})
			},
			updateMessage(message){
				let msgList = this.messageList;
				// 更新联系人
				msgList.forEach((item, index) => {
					let msg = msgList[index];
					if (item.id == message.id) {
						msgList[index] = Object.assign(msg, message);
					}
				})
				this.messageList=msgList;
			},
			getScrollHeight(){
				const query=this.$util.getQuery(this);
				setTimeout(() => {
					query.select('.cu-chat').boundingClientRect();
					query.exec(data => {
						// this.scrollHeight=data[0].height;
						this.scrollTop=data[0].height-this.newheight;
						this.loadLock=false;
					});
				}, 10)
			},
			scrollChat(e){
				const scrollView = e.detail;
				// 当前滚动条垂直位置
				const scrollTop = scrollView.scrollTop;
				// 内容高度
				const contentHeight = scrollView.scrollHeight;
				this.newheight=contentHeight;
				if(scrollTop<10 && this.loadLock==false){
					this.loadLock=true;
					this.page++;
					if(this.moreData){
						this.loading='loading';
						this.getMessageList();
					}
				}
				// 创建选择器
			  const query = uni.createSelectorQuery().in(this);
			  // 选择div
			  query.select('.scroll-view-body').boundingClientRect(data => {
				// data中包含了元素的尺寸信息，如宽、高等
				if (data) {
				  // 判断是否滚动到底部
				  this.isBottom = scrollTop + data.height + 2 >= contentHeight ? true : false;
				}
			  }).exec(); 
				
			},
			getMessageList() {
				let params={
					is_group: this.is_group,
					toContactId: this.contact.id,
					page: this.page,
					limit: this.limit
				};
				this.$api.msgApi.getMessageList(params).then(res => {
					if(this.page==1){
						msgStore.msgList = [];
					}
					let data=res.data.slice().reverse();
					data.forEach(it => {
						msgStore.msgList.unshift(it)
					})
					var _this=this;
					this.loading='more';
					
					// 如果返回的数据小于每页的数量
					if (res.data.length < this.limit) {
						this.moreData=false
						this.loading='noMore'
					}
					this.$nextTick(()=>{
						if(this.page==1){
							this.scrollToBottom();
						}else{
							this.getScrollHeight();
						}
					});
				})
			},
			//长按事件
			moreOption(e,item,index){
				
				this.timer = setTimeout(() => {
					this.curMsg = item;
					this.curIndex = index;
					let count = 0;
					let isMe = item.fromUser.id == this.user.user_id
					let isRecall = ( (this.getTime() - this.curMsg.sendTime < this.globalConfig.chatInfo.redoTime*1000 && this.curMsg.fromUser.id==this.user.user_id) || this.contact.role<3 )  && this.curMsg.type!=='webrtc';
					let isDelete = this.globalConfig.chatInfo.dbDelMsg && isMe;
					if(item.type=="text" || item.type=="emoji"){
						count = 3 //转发  引用
					}if(['image','file','video'].includes(item.type)){
						this.copyTxt="链接";
						count = 3
					}else if(item.type=="location" || item.type=="contact"){
						count = 2 //转发  引用
					}else if(item.type=="voice"){
						count = 1;//引用
					}
					if(isRecall){
						++count
					}
					if(isDelete){
						++count
					}
					if(count==0) return false;
					// 如果长按后没有移动才是长按事件
					if(this.islongPress!='move'){
						this.islongPress=true;
						this.modelName='moreOpt';
						this.showMenu(item.msg_id,count,isMe)
					}
				}, 800); // 设置为 1 秒
			},
			showMenu(msg_id,count,isMe) {
				
			    const query = this.$util.getQuery(this).select(`#msg_id_${msg_id}`).boundingClientRect();
			    query.exec((res) => {
			        if (res && res[0]) {
			            const element = res[0];
			            const windowWidth = this.width; // 获取窗口宽度
			            const windowHeight = this.height; // 获取窗口高度
			            const menuWidth = 62 * count; // 动态计算菜单宽度
			            const menuHeight = 60; // 动态计算菜单高度，按每行最多 4 个菜单项布局
						let isBottom =  false;
			
			            // 默认菜单显示在元素上方
			            let left = isMe?element.left + (element.width / 2) - (menuWidth / 1.3):element.left + (element.width / 2)- (menuWidth / 2);
			            let top = element.top - menuHeight - 10;
			
			            // 如果菜单超出左侧边界，将菜单固定到左侧边距
			            if (left < 10) {
			                left = 40; // 保留 10px 边距
			            }
			
			            // 如果菜单超出顶部边界，将菜单显示在元素下方
			            if (top < 10) {
							isBottom =  true;
			                top = element.top + element.height + 20;
			            }
			
			            // 更新菜单样式
			            this.popStyle = {
			                left: `${left}px`,
			                top: `${top}px`,
			                // width: `${menuWidth}px`,
			                height: `${menuHeight}px`,
			            };
			
			            // 计算小尾巴的样式
			            const tailLeft = element.left+ (element.width / 2)  - 10; // 小尾巴居中
						
			            const tailTop = isBottom?top-8:top+menuHeight-15; // 根据菜单显示位置调整
			
			            this.tailStyle = {
			                left: `${tailLeft}px`,
			                top: `${tailTop}px`,
			            };
			        }
			    });
			},
			ListTouchMove(e){
				this.islongPress='move';
			},
			undoMsg(){
				let message=this.curMsg;
				this.modelName='';
				this.$api.msgApi.undoMessage({ id: message.id })
				  .then(res => {
					const data = {
					  id: message.id,
					  type: "event",
					  is_undo:1,
					  content: '你撤回了一条消息',
					  oldContent:message.content,
					  toContactId: message.toContactId,
					};
					this.updateMessage(data);
				  })
				  
			},
			delMsg(){
				let message=this.curMsg;
				this.modelName='';
				uni.showModal({
					title: '删除消息会从所有人的聊天记录中抹掉，是否确定?',
					success: e => {
						if (e.confirm) {
							this.$api.msgApi.delMessage({ id: message.id })
							  .then(res => {
								if(res.code==0){
									this.messageList.splice(this.curIndex, 1);
								}
							  }) 
						}
					}
				});
				
			},
			copyMsg(){
				let content=this.$util.htmlToLines(this.curMsg.content);
				uni.setClipboardData({
					data:content,
					showToast:true
				});
				this.modelName='';
				this.curMsg='';
			},
			colEmoji(){
				let msg=this.curMsg;
				this.$api.emojiApi.addEmoji({ file_id: msg.file_id })
				  .then(res => {
					if(res.code==0){
						// 添加后更新表情列表
						this.$refs.imInput.getEmojiList();
					}
				  }) 
			},
			// 转发消息
			forwardMsg(){
				uni.navigateTo({
					url:'/pages/index/userSelection?contact_id='+this.contact_id+'&type=3'
				})
			},
			// 引用消息
			quoteMsg(){
				let msg=this.curMsg;
				let regex = /<[^>]+>/g; // 定义正则表达式，匹配所有的HTML标签
				let content=msg.content.replace(regex, '');
				if(!['text','event','location','contact'].includes(msg.type)){
					content = this.$util.getMsgType(msg.type);
				}
				let quote={
					msg_id:msg.msg_id,
					content:msg.fromUser.displayName+'：'+content,
					user_id:msg.fromUser.id,
					realname:msg.fromUser.displayName
				};
				this.$refs.imInput.quoteMessage(quote);
			},
			reEdit(text){
				this.$refs.imInput.inputMsg=text;
				this.$refs.imInput.isFocus=true;
			},
			// 滚动到页面底部
			scrollToBottom(){
				this.scrollTop=99999999;
				const query=this.$util.getQuery(this);
				setTimeout(() => {
					query.select('.cu-chat').boundingClientRect();
					query.exec(data => {
						let height=999999;
						if(data[0]){
							height=data[0].height;
						}
						this.scrollTop=height+3000;
					});
				}, 10);
			},
			// 打开聊天详情
			openDetails(){
				uni.navigateTo({
					url:"/pages/message/detail?id=" + this.contact.id+"&is_group=" + this.contact.is_group
				})
			},
			// 重新发送
			reSend(message){
				message.status='going';
				this.sendMessage(JSON.parse(JSON.stringify(message)),'',true);
			},
			// 发送消息
			sendMessage(message,file,isReSend=false){
				// 如果开启了群聊禁言或者关闭了单聊权限，就不允许发送消息
				if(!this.nospeak()){
					//已开启禁言
					uni.showToast({
						title: '群已开启禁言，无法发送消息',
						icon: "none"
					})
					return;
				}
				let user=this.user;
				user.id=user.user_id;
				message.fromUser=user;
				message.from_user=this.user.user_id;
				message.toContactId=this.contact.id;
				message.is_group=this.contact.is_group;
				if(!isReSend){
					this.messageList.push(message);
				}
				this.scrollToBottom();
				let fileTypes = ["image", "file", "video",'voice'];   
				let simpleType=['text','location','contact','emoji'];
				if(simpleType.includes(message.type)){
					this.$api.msgApi.sendMessage(message)
						.then((res) => {
							if(res.code==0){
								this.updateMessage(res.data);
							}else if(res.code==401){
								// 删除最后一条信息
								this.messageList.pop();
								//已开启禁言
								uni.showToast({
									title: res.msg,
									icon: "none"
								})
							}else{
								this.sendFailed(message);
							}
						})
						.catch((error) => {
							this.sendFailed(message);
						});
				}else if (fileTypes.includes(message.type)) {
					var self=this;
					let maxSize=this.globalConfig.fileUpload.size ?? 10;
					if(message.fileSize>maxSize*1024*1024){
						return uni.showToast({
							title: '文件大小不能超过'+maxSize+'M',
							icon:'error'
						})
					}
					uni.uploadFile({
						url: this.$api.msgApi.uploadUrl,
						filePath: message.content,
						name: 'file',
						header: {
							'Authorization': uni.getStorageSync('authToken'),
						},
						formData: {
							message: JSON.stringify(message)
						},
						success: (e) => {
							let res=JSON.parse(e.data);
							
							if(res.code==0){
								this.updateMessage(res.data);
							}else if(res.code==401){
								// 删除最后一条信息
								this.messageList.pop();
								//已开启禁言
								uni.showToast({
									title: res.msg,
									icon: "none"
								})
							}else{
								this.sendFailed(message);
							}
						},
						fail: (res) => {
							this.sendFailed(message);
						}
					})
				}
				
			},
			sendFailed(message){
				message.status='failed';
				this.updateMessage(JSON.parse(JSON.stringify(message)));
			},
			// 语音播放基础函数
			playNow: function (voicelUrl, index){
				this.playIndex  = index;
				innerAudioContext.autoplay=true;
				innerAudioContext.src = voicelUrl;
				innerAudioContext.play();
				return true;
			},
			// 播放语音
			playVoice: function (e) {
				var voicelUrl = e.currentTarget.dataset.voice;
				var index     = e.currentTarget.dataset.index;
				if (this.playIndex == -1){
					return this.playNow(voicelUrl, index);
				}
				if (this.playIndex == index) {
					innerAudioContext.stop();
					this.playIndex = -1;
				} else {
					innerAudioContext.stop();
					this.playIndex = -1;
					this.playNow(voicelUrl, index);
				}
			},
			// 如果点击了聊天记录列表页,需要收起表情面板或者其他的面板
			closeInput(e){
				this.boxStatus++;
			},
			// 禁言时禁止发送消息
			nospeak(){
			  if(this.is_group==1 && this.contact.setting.nospeak>0){
				if(this.contact.setting.nospeak==1 && this.contact.role<3){
				  return true;
				}else if(this.contact.setting.nospeak==2 && this.contact.role==1){
				  return true;
				}else{
				  return false;
				}
			  }else{
				return true;
			  }
			},
		}
	}
</script>

<style lang="scss">
page{
  padding-bottom: 100upx;
}

#more-oprate{
	min-height:100%;
	justify-content: flex-end;
	flex-direction: column;
}
.cu-chat .cu-item.self {
    justify-content: flex-start;
    text-align: right;
}
.bg-light-green{
	background-color: #95ec69;
}
.at-fixed-item{position:fixed;right:20rpx;bottom:120rpx;background-color: #fff;border-radius:30rpx;color:#18bc37;padding:12rpx 18rpx}
.im{padding:30rpx;}
.im-system-msg{color:#FFFFFF; font-size:26rpx; line-height:38rpx; padding:5px 10px; display:block; border-radius:6rpx;}
.im-msg{margin-bottom:28px; display:flex; flex-direction:row; flex-wrap:nowrap;}
.im-voice-msg{height:80rpx; padding:0 20rpx; background-color:#E7F0F3; color:#2B2E3D; min-width:160rpx; max-width:400rpx;}
.im-voice-msg-text{font-size:22rpx; margin:0 5rpx;}
.im-location-msg{ background-color:#E7F0F3; color:#2B2E3D;text-align: left !important;}
.im-contact-msg{ width:360rpx; background-color:#E7F0F3; color:#2B2E3D;text-align: left !important;}
.cu-chat .cu-item>.main {
    max-width: calc(100% - 230rpx);
    margin: 0 0.8rem;
    display: flex;
    align-items: center;
	}
.course-video{
	overflow: hidden;
	position: relative;
}

.icon-center{
		position: absolute;
	    top: 50%;
	    z-index: 4;
	    transform: translate(-50%, -50%);
	    left: 50%;
		padding: 0 4rpx 0 6rpx;
}
.video-duration{
	position: absolute;
	bottom:5px;
	right:5px;
}
.relative-shadow{
	position: absolute;width:100%;height:100%;background: #8383833d;z-index:1;
}
.file-card{
	width:420rpx;
	height:120rpx;
	.file-icon{
		width:60rpx;
		height:80rpx;
	}
	.file-name{
		text-align: left !important;
		width:300rpx;
	}
	.file-size{
		text-align: left !important;
		margin-top:8rpx;
	}
}

.icon-spin{
	animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.main .content ::v-deep uni-text , 
.main .content ::v-deep uni-text span,
 .main .content ::v-deep text,
  .main .content ::v-deep uni-rich-text{
	word-wrap: break-word !important;
	word-break: break-all !important;
}

.main .content ::v-deep ._block ._a{
	pointer-events: none !important;
}

.text-container{
	-webkit-user-select:text !important;
	user-select:text !important;
	font-size:48rpx;
	word-wrap: break-word !important;
	text-align: left;
	line-height: 1.5;
	letter-spacing: 1.2px;
	color:#333;
}
::v-deep .checklist-group{
	display: grid !important;
	.checklist-box{
		padding:20rpx;
		.checkbox__inner{
			width:40rpx !important;
			height:40rpx !important;
			overflow:hidden;
			.checkbox__inner-icon{
				position: absolute;
				top: -8px !important;
				left: -4px !important;
				height: 20px !important;
				width: 20px !important;
				border-right-width: 2px !important;
				border-bottom-width: 2px !important;
			}
		}
		.checklist-content{
			margin-left:20rpx;
			.checklist-text{
				font-size:36rpx !important;
			}
			
		}
	}
	.is-checked{
		.checkbox__inner{
			background-color: #18bc37 !important;
			border-color: #18bc37 !important;
		}
		.checklist-content{
			.checklist-text{
				color: #18bc37 !important;
			}
			
		}
	}
}
.read-status{
	font-weight: 600;
}



</style>

<style lang="scss" scoped>
	.message-quote{
		padding:8rpx;
		font-size:24rpx;
		margin-top:16rpx;
		background-color: #e3e3e3;
		overflow: hidden !important;
		text-overflow: ellipsis;
		white-space: nowrap !important;
		max-width:380rpx;
		text-align: left;
	}
	// 设置表情图片居中
	::v-deep .emoji-image{
		vertical-align: text-top !important;
	}
	
	.cu-chat ::v-deep .cu-item {
	    padding: 20rpx;
	}
	.cu-chat ::v-deep .cu-item:last-child{
	    padding-bottom:60rpx;
	}
	.back-unread{
		background-color: #e3e3e3;
		padding:4rpx 10rpx;
		border-radius: 50%;
		font-size: 22rpx;
	}

.add-modal {
	.add-dialog {
		display: flex;
		flex-wrap: wrap;
		height: 100rpx; /* 与菜单高度一致 */
		background-color: #4f4f4f;
		color: #fff;
		border-radius: 10rpx;
		justify-content: space-between;
		align-items: center;
		position: absolute;
		padding: 10rpx;

		.add-item {
			width: 90rpx; /* 每个菜单项的宽度 */
			height: 70rpx; /* 每个菜单项的高度 */
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			margin: 6rpx;
			line-height: 1.5;
			view{
				font-size: 22rpx;
			}
		}

		.add-dialog-tail {
			width: 20px;
			height: 20px;
			position: fixed;
			transform: rotate(45deg);
			background: #4f4f4f;
			z-index: -1;
		}
	}
}
.show{
	position: fixed;
	top: 0;
	z-index: 9999;
	height: 100vh;
	width: 100vw;
}
.none{
	position: fixed;
	top: 0;
	right: 0;
	z-index: -10;
	opacity: 0;
}
  .blur-background {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background-size: cover;
    background-position: center;
  }
 
  .filter-blur::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(6px); /* 应用10px的背景模糊效果 */
    z-index: 0;
  }
  
  .message-head{
	width:100%;
	margin-bottom: 6rpx;
  }
</style>
