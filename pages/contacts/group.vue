<template>
	<view>
		<cu-custom bgColor="bg-main-bar" :isBack="true">
			<template #backText></template>
			<template #content>群聊列表</template>
			<template #right>
				<view class="f-20 ml-10 mr-10" @tap="search()">
					<text class="cuIcon-search"></text>
				</view>
			</template>
		</cu-custom>
		<view class="cu-list menu-avatar no-padding">
			<view class="cu-item" v-for="(items,sub) in groupList" :key="sub" @tap='openDetails(items)'>
				<view class='cu-avatar lg radius mr-15' :style="[{backgroundImage:'url('+items.avatar+')'}]">
				</view>
				<view class="content">
					<view class="c-333">{{items.displayName}}</view>
				</view>
				<view class="action">
					 <text class="c-999 cuIcon-peoplefill" v-if="items.owner_id==userInfo.user_id"></text>
				</view>
				
			</view>
			<Empty v-if="!groupList.length" noDatatext="暂无群聊" textcolor="#999" ></Empty>
		</view>

	</view>
</template>

<script>
	import { storeToRefs } from 'pinia';
	import { useMsgStore } from '@/store/message';
	import { useloginStore } from '@/store/login'
	import pinia from '@/store/index'
	const userStore = useloginStore(pinia);
	const msgStore = useMsgStore(pinia)
	const {contacts} = storeToRefs(msgStore);
	/**
	 * 初始的引导页
	 */
	export default {
		name  : "group",
		data() {
			return {
				groupList:[],
				userInfo:userStore.userInfo
			};
		},
		created() {
		},
		mounted(){
			this.initContacts(this.msgs);
		},
		methods: {
			initContacts(arr){
				const allContacts=uni.getStorageSync('allContacts');
				const contacts=allContacts.filter((item)=>{
					return item.is_group==1;
				})
				// 将联系人进行排序
				const sorted = contacts.sort((a, b) => {
				  if (a.index === '#') {
				    return 1;
				  }
				  if (b.index === '#') {
				    return -1;
				  }
				  return a.index.localeCompare(b.index, 'zh');
				});
				this.groupList=sorted;
			},
			// 打开聊天
			openDetails(items){
				uni.navigateTo({
					url:"/pages/message/chat?id="+items.id
				})
			},
			search(){
				uni.navigateTo({
					url:"/pages/index/search?type=3"
				})
			}
		}
	}
</script>

<style scoped>

</style>