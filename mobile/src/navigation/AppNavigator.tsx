import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Home & Feed
import HomeScreen from '../screens/home/HomeScreen';

// Profile & Settings
import ProfileScreen from '../screens/profile/ProfileScreen';

// Wallet & Rewards
import WalletScreen from '../screens/wallet/WalletScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';

// Create Content
import CreatePostScreen from '../screens/create/CreatePostScreen';

// Messaging
import MessagesListScreen from '../screens/messages/MessagesListScreen';
import ChatScreen from '../screens/messages/ChatScreen';

// Live Streaming
import LiveStreamScreen from '../screens/livestream/LiveStreamScreen';
import CreateStreamScreen from '../screens/livestream/CreateStreamScreen';

// Marketplace
import MarketplaceHomeScreen from '../screens/marketplace/MarketplaceHomeScreen';
import ProductSearchScreen from '../screens/marketplace/ProductSearchScreen';
import ProductDetailsScreen from '../screens/marketplace/ProductDetailsScreen';
import CartScreen from '../screens/marketplace/CartScreen';
import CheckoutScreen from '../screens/marketplace/CheckoutScreen';
import OrdersScreen from '../screens/marketplace/OrdersScreen';
import OrderDetailsScreen from '../screens/marketplace/OrderDetailsScreen';
import ProductSearchHistoryScreen from '../screens/marketplace/ProductSearchHistoryScreen';

// Merchant
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen';
import AddProductScreen from '../screens/merchant/AddProductScreen';

// Affiliate
import AffiliateApplicationScreen from '../screens/affiliate/AffiliateApplicationScreen';
import AffiliateEarningsScreen from '../screens/affiliate/AffiliateEarningsScreen';
import MyPartnershipsScreen from '../screens/affiliate/MyPartnershipsScreen';

// Battles
import CreateBattleScreen from '../screens/battles/CreateBattleScreen';
import LiveBattleScreen from '../screens/battles/LiveBattleScreen';
import BattleResultsScreen from '../screens/battles/BattleResultsScreen';

// Business/Ads
import BusinessDashboardScreen from '../screens/business/BusinessDashboardScreen';
import CreateAdScreen from '../screens/business/CreateAdScreen';

// Admin
import AdminDashboardMobileScreen from '../screens/admin/AdminDashboardMobileScreen';
import ContentModerationScreen from '../screens/admin/ContentModerationScreen';
import AdApprovalScreen from '../screens/admin/AdApprovalScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import PlatformAnalyticsScreen from '../screens/admin/PlatformAnalyticsScreen';

// Creator
import SubscriptionSettingsScreen from '../screens/creator/SubscriptionSettingsScreen';
import BulletinManagerScreen from '../screens/creator/BulletinManagerScreen';
import LiveShowcaseManagerScreen from '../screens/creator/LiveShowcaseManagerScreen';

// Content Quality
import ContentOriginalityReportScreen from '../screens/content/ContentOriginalityReportScreen';
import AppealSubmissionScreen from '../screens/content/AppealSubmissionScreen';

// Help & Support
import HelpCenterScreen from '../screens/help/HelpCenterScreen';
import HelpArticleScreen from '../screens/help/HelpArticleScreen';
import FAQScreen from '../screens/help/FAQScreen';
import SupportTicketScreen from '../screens/help/SupportTicketScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Marketplace') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'Create') {
            iconName = 'add-circle';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceHomeScreen} />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size + 10} color={color} />
          ),
        }}
      />
      <Tab.Screen name="Messages" component={MessagesListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  // Get authentication state from Zustand store
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            {/* Main Tabs */}
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Wallet & Rewards */}
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{ headerShown: true, title: 'Wallet' }}
            />
            <Stack.Screen
              name="Rewards"
              component={RewardsScreen}
              options={{ headerShown: true, title: 'Rewards' }}
            />

            {/* Messaging */}
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: true, title: 'Chat' }}
            />

            {/* Live Streaming */}
            <Stack.Screen
              name="LiveStream"
              component={LiveStreamScreen}
              options={{ headerShown: true, title: 'Live Stream' }}
            />
            <Stack.Screen
              name="CreateStream"
              component={CreateStreamScreen}
              options={{ headerShown: true, title: 'Create Stream' }}
            />

            {/* Marketplace Stack */}
            <Stack.Screen
              name="ProductSearch"
              component={ProductSearchScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProductDetails"
              component={ProductDetailsScreen}
              options={{ headerShown: true, title: 'Product Details' }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ headerShown: true, title: 'Shopping Cart' }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ headerShown: true, title: 'Checkout' }}
            />
            <Stack.Screen
              name="Orders"
              component={OrdersScreen}
              options={{ headerShown: true, title: 'My Orders' }}
            />
            <Stack.Screen
              name="OrderDetails"
              component={OrderDetailsScreen}
              options={{ headerShown: true, title: 'Order Details' }}
            />
            <Stack.Screen
              name="ProductSearchHistory"
              component={ProductSearchHistoryScreen}
              options={{ headerShown: true, title: 'Search History' }}
            />

            {/* Merchant Stack */}
            <Stack.Screen
              name="MerchantDashboard"
              component={MerchantDashboardScreen}
              options={{ headerShown: true, title: 'Merchant Dashboard' }}
            />
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ headerShown: false }}
            />

            {/* Affiliate Stack */}
            <Stack.Screen
              name="AffiliateApplication"
              component={AffiliateApplicationScreen}
              options={{ headerShown: true, title: 'Apply for Affiliate' }}
            />
            <Stack.Screen
              name="AffiliateEarnings"
              component={AffiliateEarningsScreen}
              options={{ headerShown: true, title: 'Affiliate Earnings' }}
            />
            <Stack.Screen
              name="MyPartnerships"
              component={MyPartnershipsScreen}
              options={{ headerShown: true, title: 'My Partnerships' }}
            />

            {/* Battles Stack */}
            <Stack.Screen
              name="CreateBattle"
              component={CreateBattleScreen}
              options={{ headerShown: true, title: 'Create Battle' }}
            />
            <Stack.Screen
              name="LiveBattle"
              component={LiveBattleScreen}
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="BattleResults"
              component={BattleResultsScreen}
              options={{ headerShown: true, title: 'Battle Results' }}
            />

            {/* Business/Ads Stack */}
            <Stack.Screen
              name="BusinessDashboard"
              component={BusinessDashboardScreen}
              options={{ headerShown: true, title: 'Business Dashboard' }}
            />
            <Stack.Screen
              name="CreateAd"
              component={CreateAdScreen}
              options={{ headerShown: true, title: 'Create Ad' }}
            />

            {/* Admin Stack */}
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardMobileScreen}
              options={{ headerShown: true, title: 'Admin Dashboard' }}
            />
            <Stack.Screen
              name="ContentModeration"
              component={ContentModerationScreen}
              options={{ headerShown: true, title: 'Content Moderation' }}
            />
            <Stack.Screen
              name="AdApproval"
              component={AdApprovalScreen}
              options={{ headerShown: true, title: 'Ad Approval' }}
            />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
              options={{ headerShown: true, title: 'User Management' }}
            />
            <Stack.Screen
              name="PlatformAnalytics"
              component={PlatformAnalyticsScreen}
              options={{ headerShown: true, title: 'Platform Analytics' }}
            />

            {/* Creator Stack */}
            <Stack.Screen
              name="SubscriptionSettings"
              component={SubscriptionSettingsScreen}
              options={{ headerShown: true, title: 'Subscription Settings' }}
            />
            <Stack.Screen
              name="BulletinManager"
              component={BulletinManagerScreen}
              options={{ headerShown: true, title: 'Bulletin Manager' }}
            />
            <Stack.Screen
              name="LiveShowcaseManager"
              component={LiveShowcaseManagerScreen}
              options={{ headerShown: true, title: 'Live Showcase' }}
            />

            {/* Content Quality Stack */}
            <Stack.Screen
              name="ContentOriginalityReport"
              component={ContentOriginalityReportScreen}
              options={{ headerShown: true, title: 'Originality Report' }}
            />
            <Stack.Screen
              name="AppealSubmission"
              component={AppealSubmissionScreen}
              options={{ headerShown: true, title: 'Submit Appeal' }}
            />

            {/* Help & Support Stack */}
            <Stack.Screen
              name="HelpCenter"
              component={HelpCenterScreen}
              options={{ headerShown: true, title: 'Help Center' }}
            />
            <Stack.Screen
              name="HelpArticle"
              component={HelpArticleScreen}
              options={{ headerShown: true, title: 'Help Article' }}
            />
            <Stack.Screen
              name="FAQs"
              component={FAQScreen}
              options={{ headerShown: true, title: 'FAQs' }}
            />
            <Stack.Screen
              name="SupportTicket"
              component={SupportTicketScreen}
              options={{ headerShown: true, title: 'Support Ticket' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
