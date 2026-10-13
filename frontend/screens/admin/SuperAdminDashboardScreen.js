import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Modal,
  TextInput,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import WebSidebar from '../../components/WebSidebar';
import WebNavbar from '../../components/WebNavbar';
import NotificationSheet from '../../components/NotificationSheet';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { useDashboardBackHandler } from '../../hooks/useDashboardBackHandler';
import { handleLogoutAndReset } from '../../utils/authHelper';

const PERTAMINA_BLUE = ['#003366', '#0055A5'];
const PERTAMINA_RED = ['#ED1C24', '#B30000'];
const PERTAMINA_GREEN = ['#00A651', '#007A3E'];

// Helper untuk efek Glassmorphism di Web
const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

export default function SuperAdminDashboardScreen({ navigation }) {
  // Hanya SUPER_ADMIN yang diizinkan mengakses Pusat Kendali ini
  useRoleGuard(['SUPER_ADMIN']);

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'audit'
  const [activeMenu, setActiveMenu] = useState('Home');
  const [previousMenu, setPreviousMenu] = useState('Home');
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Users Management State
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ total: 0, totalPages: 1 });

  // Role Change Modal
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newSelectedRole, setNewSelectedRole] = useState('AMT');
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Status Toggle Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Notification & Logout States
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Responsive Layout (Identik dengan AdminDashboardScreen)
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);
  const isLargeScreen = screenWidth > 768;

  // Background floating animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim3, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ])
    ).start();
  }, [floatAnim1, floatAnim2, floatAnim3, slideAnim]);

  const orb1TranslateY = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const orb2TranslateY = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const orb3TranslateY = floatAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const slideInterpolate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -32] });

  // Logout Handlers
  const handleLogout = () => {
    setPreviousMenu(activeMenu);
    setActiveMenu('Logout');
    setIsLogoutVisible(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutVisible(false);
    setActiveMenu(previousMenu);
  };

  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    await handleLogoutAndReset(navigation);
  };

  useDashboardBackHandler({
    isLogoutVisible,
    setIsLogoutVisible,
    handleLogout,
    handleCancelLogout,
    showNotificationsModal,
    setShowNotificationsModal,
  });

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/admins/system-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setSummaryData(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching system summary:', err.response?.data?.error || err.message);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setUsersLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const params = {
        page,
        limit: 12,
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter
      };

      const res = await axios.get(`${API_URL}/api/admins/all-users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data?.success) {
        setUsersList(res.data.users || []);
        setUserPagination(res.data.pagination || { total: 0, totalPages: 1 });
        setUserPage(page);
      }
    } catch (err) {
      console.log('Error fetching users:', err.response?.data?.error || err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRoleFilter, userStatusFilter]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setAuditLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const params = {
        page,
        limit: 15,
        search: auditSearch,
        actionType: auditActionFilter
      };

      const res = await axios.get(`${API_URL}/api/admins/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data?.success) {
        setAuditLogs(res.data.logs || []);
        setAuditPagination(res.data.pagination || { total: 0, totalPages: 1 });
        setAuditPage(page);
      }
    } catch (err) {
      console.log('Error fetching audit logs:', err.response?.data?.error || err.message);
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditActionFilter]);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadNotificationsCount(res.data.notifications.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.log('Error notifications:', err.message);
    }
  }, []);

  const handleReadNotification = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.log('Gagal update notifikasi:', error.message);
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      } else {
        await handleLogoutAndReset(navigation);
        return;
      }
      await Promise.all([
        fetchSummary(),
        fetchNotifications()
      ]);
    };
    init();
  }, [fetchSummary, fetchNotifications, navigation]);

  // Lazy tab fetching
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1);
    } else if (activeTab === 'audit') {
      fetchAuditLogs(1);
    }
  }, [activeTab, fetchUsers, fetchAuditLogs]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSummary(),
      fetchNotifications(),
      activeTab === 'users' ? fetchUsers(userPage) : null,
      activeTab === 'audit' ? fetchAuditLogs(auditPage) : null
    ]);
    setRefreshing(false);
  };

  // Submit Role Change
  const handleUpdateRole = async () => {
    if (!selectedUserForRole) return;
    try {
      setRoleUpdating(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/api/admins/all-users/${selectedUserForRole.id}/role`,
        { role: newSelectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setRoleModalVisible(false);
        fetchUsers(userPage);
        fetchSummary();
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Gagal Mengubah Role', msg);
      }
    } finally {
      setRoleUpdating(false);
    }
  };

  // Submit Status Toggle (Active / Inactive)
  const handleToggleStatus = async () => {
    if (!selectedUserForStatus) return;
    try {
      setStatusUpdating(true);
      const token = await AsyncStorage.getItem('token');
      const newStatus = selectedUserForStatus.status !== 'ACTIVE';
      const res = await axios.put(
        `${API_URL}/api/admins/all-users/${selectedUserForStatus.id}/status`,
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setStatusModalVisible(false);
        fetchUsers(userPage);
        fetchSummary();
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Gagal Mengubah Status', msg);
      }
    } finally {
      setStatusUpdating(false);
    }
  };

  // Format Helper for Dates
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <View style={tw`flex-1 bg-[#F4F7FA] justify-center items-center`}>
        <ActivityIndicator size="large" color="#0055A5" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
      {/* Animated Background Orbs (Identik dengan AdminDashboardScreen) */}
      <Animated.View style={[tw`absolute -top-20 -left-10 w-[35rem] h-[35rem] rounded-full opacity-15 pointer-events-none`, { transform: [{ translateY: orb1TranslateY }] }]}>
        <LinearGradient colors={['#0055A5', '#003366']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -top-20 -right-20 w-[25rem] h-[25rem] rounded-full opacity-15 pointer-events-none`, { transform: [{ translateY: orb3TranslateY }] }]}>
        <LinearGradient colors={['#00A651', '#007A3B']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -bottom-40 -right-10 w-[30rem] h-[30rem] rounded-full opacity-15 pointer-events-none`, { transform: [{ translateY: orb2TranslateY }] }]}>
        <LinearGradient colors={['#ED1C24', '#B30000']} style={tw`flex-1 rounded-full`} />
      </Animated.View>

      <SafeAreaView style={tw`flex-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>
        {/* Modal Notifikasi */}
        <NotificationSheet
          visible={showNotificationsModal}
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onRead={handleReadNotification}
        />

        {/* ULTRA PREMIUM SIDEBAR (Desktop Only) */}
        {isLargeScreen && user && (
          <WebSidebar
            user={user}
            activeMenu="SuperAdminDashboard"
            navigation={navigation}
            handleLogout={handleLogout}
            unreadNotificationsCount={unreadNotificationsCount}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <View style={tw`flex-1 relative`}>
          {/* STICKY NAVBAR (Floating Modern Style - Sama persis Mobile & Web) */}
          {user && (
            <WebNavbar
              user={user}
              navigation={navigation}
              rightAction={
                !isLargeScreen ? (
                  <TouchableOpacity
                    onPress={() => setShowNotificationsModal(true)}
                    style={[
                      tw`w-9 h-9 rounded-full bg-blue-50/90 items-center justify-center relative mr-1 border border-blue-100 shadow-sm`,
                      Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="notifications-outline" size={18} color="#0055A5" />
                    {unreadNotificationsCount > 0 && (
                      <View style={tw`absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#ED1C24] border-2 border-white`} />
                    )}
                  </TouchableOpacity>
                ) : null
              }
            />
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`${isLargeScreen ? 'p-6 max-w-7xl mx-auto w-full' : 'p-6 pt-6 pb-32 w-full'}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0055A5']} />}
          >
            {/* Title Section dengan Badge Role Super Admin */}
            <View style={tw`mb-6 flex-row items-center justify-between flex-wrap gap-2`}>
              <View>
                <View style={tw`flex-row items-center gap-2 mb-1`}>
                  <Text style={tw`text-[11px] font-black text-[#0055A5] uppercase tracking-widest`}>
                    PUSAT KENDALI TERPADU
                  </Text>
                  <View style={tw`px-2.5 py-0.5 rounded-full bg-red-100/90 border border-red-200/80 flex-row items-center`}>
                    <Ionicons name="shield-checkmark" size={11} color="#ED1C24" style={tw`mr-1`} />
                    <Text style={tw`text-[10px] font-black text-[#ED1C24] tracking-widest uppercase`}>
                      SUPER ADMIN
                    </Text>
                  </View>
                </View>
                <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                  Overview <Text style={tw`text-[#ED1C24]`}>Sistem.</Text>
                </Text>
              </View>

              <View style={[tw`flex-row items-center px-3.5 py-2 rounded-2xl border border-white/80 shadow-sm`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle }]}>
                <View style={tw`w-2.5 h-2.5 rounded-full bg-[#00A651] mr-2`} />
                <Text style={tw`text-xs font-bold text-gray-700`}>Sistem Operasional Aktif</Text>
              </View>
            </View>

            {/* Segmented Control / Tabs Header */}
            <View style={tw`mb-6`}>
              <View style={[tw`flex-row p-1.5 rounded-[22px] border border-white/80 shadow-sm`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle }]}>
                <TouchableOpacity
                  onPress={() => setActiveTab('overview')}
                  style={[
                    tw`flex-1 py-2.5 rounded-[16px] flex-row items-center justify-center`,
                    activeTab === 'overview' ? tw`bg-[#0055A5] shadow-md shadow-blue-900/30` : {},
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="activity" size={15} color={activeTab === 'overview' ? '#FFFFFF' : '#4B5563'} style={tw`mr-1.5`} />
                  <Text style={[tw`text-xs sm:text-sm font-black tracking-tight`, activeTab === 'overview' ? tw`text-white` : tw`text-gray-600`]}>
                    Ringkasan Sistem
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveTab('users')}
                  style={[
                    tw`flex-1 py-2.5 rounded-[16px] flex-row items-center justify-center`,
                    activeTab === 'users' ? tw`bg-[#0055A5] shadow-md shadow-blue-900/30` : {},
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="users" size={15} color={activeTab === 'users' ? '#FFFFFF' : '#4B5563'} style={tw`mr-1.5`} />
                  <Text style={[tw`text-xs sm:text-sm font-black tracking-tight`, activeTab === 'users' ? tw`text-white` : tw`text-gray-600`]}>
                    Kelola Pengguna
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveTab('audit')}
                  style={[
                    tw`flex-1 py-2.5 rounded-[16px] flex-row items-center justify-center`,
                    activeTab === 'audit' ? tw`bg-[#0055A5] shadow-md shadow-blue-900/30` : {},
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="shield" size={15} color={activeTab === 'audit' ? '#FFFFFF' : '#4B5563'} style={tw`mr-1.5`} />
                  <Text style={[tw`text-xs sm:text-sm font-black tracking-tight`, activeTab === 'audit' ? tw`text-white` : tw`text-gray-600`]}>
                    Audit Log
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ============================================================ */}
            {/* TAB 1: RINGKASAN SISTEM (OVERVIEW)                           */}
            {/* ============================================================ */}
            {activeTab === 'overview' && (
              <View>
                {/* SUPER STAT CARDS (Pola Responsive Identik dengan AdminDashboard) */}
                {isLargeScreen ? (
                  /* DESKTOP: 4 Kartu Sejajar */
                  <View style={tw`flex-row justify-between mb-4`}>
                    {/* Kartu 1: Total Pengguna */}
                    <TouchableOpacity
                      style={[
                        tw`flex-1 p-5 rounded-[28px] border border-white/60 mr-3 justify-between`,
                        { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
                        Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                      ]}
                      onPress={() => setActiveTab('users')}
                      activeOpacity={0.85}
                    >
                      <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-5`}>
                        <Feather name="users" size={22} color="#0055A5" />
                      </View>
                      <View>
                        <Text style={tw`text-4xl font-black text-gray-800 tracking-tighter`}>
                          {summaryData?.users?.total ?? 0}
                        </Text>
                        <Text style={tw`text-[11px] text-gray-500 font-black uppercase tracking-widest mt-1.5`}>
                          Total Pengguna
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Kartu 2: Isu Kendaraan */}
                    <TouchableOpacity
                      style={[
                        tw`flex-1 p-5 rounded-[28px] border border-white/60 mr-3 justify-between`,
                        { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.1, shadowRadius: 20 },
                        Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                      ]}
                      onPress={() => navigation.navigate('IssueList')}
                      activeOpacity={0.85}
                    >
                      <View style={tw`w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-5`}>
                        <Feather name="alert-circle" size={22} color="#ED1C24" />
                      </View>
                      <View>
                        <Text style={tw`text-4xl font-black text-[#ED1C24] tracking-tighter`}>
                          {summaryData?.issues?.active ?? 0}
                        </Text>
                        <Text style={tw`text-[11px] text-red-400 font-black uppercase tracking-widest mt-1.5`}>
                          Isu Berjalan
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Kartu 3: Total Kendaraan */}
                    <TouchableOpacity
                      style={[
                        tw`flex-1 p-5 rounded-[28px] border border-white/60 mr-3 justify-between`,
                        { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.05, shadowRadius: 20 },
                        Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                      ]}
                      onPress={() => navigation.navigate('VehicleList')}
                      activeOpacity={0.85}
                    >
                      <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-5`}>
                        <Feather name="truck" size={22} color="#0055A5" />
                      </View>
                      <View>
                        <Text style={tw`text-4xl font-black text-gray-800 tracking-tighter`}>
                          {summaryData?.vehicles?.total ?? 0}
                        </Text>
                        <Text style={tw`text-[11px] text-gray-500 font-black uppercase tracking-widest mt-1.5`}>
                          Total Kendaraan
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Kartu 4: Handover Hari Ini */}
                    <TouchableOpacity
                      style={[
                        tw`flex-1 p-5 rounded-[28px] border border-white/60 justify-between`,
                        { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.1, shadowRadius: 20 },
                        Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                      ]}
                      onPress={() => navigation.navigate('History')}
                      activeOpacity={0.85}
                    >
                      <View style={tw`w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-5`}>
                        <Feather name="repeat" size={22} color="#00A651" />
                      </View>
                      <View>
                        <Text style={tw`text-4xl font-black text-gray-800 tracking-tighter`}>
                          {summaryData?.handovers?.today ?? 0}
                        </Text>
                        <Text style={tw`text-[11px] text-emerald-600 font-black uppercase tracking-widest mt-1.5`}>
                          Handover Hari Ini
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* MOBILE: 2 Kolom x 2 Baris (Sama persis Admin Mobile) */
                  <>
                    <View style={tw`flex-row justify-between mb-3.5`}>
                      <TouchableOpacity
                        style={[
                          tw`flex-1 p-4 sm:p-5 rounded-[28px] border border-white/60 mr-2 justify-between`,
                          { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 }
                        ]}
                        onPress={() => setActiveTab('users')}
                        activeOpacity={0.85}
                      >
                        <View style={tw`w-11 h-11 bg-blue-100 rounded-full items-center justify-center mb-4`}>
                          <Feather name="users" size={20} color="#0055A5" />
                        </View>
                        <View>
                          <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                            {summaryData?.users?.total ?? 0}
                          </Text>
                          <Text style={tw`text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1`} numberOfLines={1}>
                            Total Pengguna
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          tw`flex-1 p-4 sm:p-5 rounded-[28px] border border-white/60 ml-2 justify-between`,
                          { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.1, shadowRadius: 20 }
                        ]}
                        onPress={() => navigation.navigate('IssueList')}
                        activeOpacity={0.85}
                      >
                        <View style={tw`w-11 h-11 bg-red-100 rounded-full items-center justify-center mb-4`}>
                          <Feather name="alert-circle" size={20} color="#ED1C24" />
                        </View>
                        <View>
                          <Text style={tw`text-3xl font-black text-[#ED1C24] tracking-tighter`}>
                            {summaryData?.issues?.active ?? 0}
                          </Text>
                          <Text style={tw`text-[10px] text-red-400 font-black uppercase tracking-widest mt-1`} numberOfLines={1}>
                            Isu Berjalan
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={tw`flex-row justify-between mb-4`}>
                      <TouchableOpacity
                        style={[
                          tw`flex-1 p-4 sm:p-5 rounded-[28px] border border-white/60 mr-2 justify-between`,
                          { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.05, shadowRadius: 20 }
                        ]}
                        onPress={() => navigation.navigate('VehicleList')}
                        activeOpacity={0.85}
                      >
                        <View style={tw`w-11 h-11 bg-blue-100 rounded-full items-center justify-center mb-4`}>
                          <Feather name="truck" size={20} color="#0055A5" />
                        </View>
                        <View>
                          <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                            {summaryData?.vehicles?.total ?? 0}
                          </Text>
                          <Text style={tw`text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1`} numberOfLines={1}>
                            Total Kendaraan
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          tw`flex-1 p-4 sm:p-5 rounded-[28px] border border-white/60 ml-2 justify-between`,
                          { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.1, shadowRadius: 20 }
                        ]}
                        onPress={() => navigation.navigate('History')}
                        activeOpacity={0.85}
                      >
                        <View style={tw`w-11 h-11 bg-green-100 rounded-full items-center justify-center mb-4`}>
                          <Feather name="repeat" size={20} color="#00A651" />
                        </View>
                        <View>
                          <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                            {summaryData?.handovers?.today ?? 0}
                          </Text>
                          <Text style={tw`text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1`} numberOfLines={1}>
                            Handover Hari Ini
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Breakdown Role Ringkas */}
                <View style={[
                  tw`flex-row flex-wrap items-center justify-between gap-2 p-3 sm:p-4 rounded-[22px] border border-white/80 mb-6`,
                  { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle }
                ]}>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-2 h-2 rounded-full bg-emerald-500 mr-2`} />
                    <Text style={tw`text-xs font-bold text-gray-600`}>
                      AMT: <Text style={tw`font-black text-gray-900`}>{summaryData?.users?.amt ?? 0}</Text>
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-2 h-2 rounded-full bg-purple-500 mr-2`} />
                    <Text style={tw`text-xs font-bold text-gray-600`}>
                      Pengawas: <Text style={tw`font-black text-gray-900`}>{summaryData?.users?.pengawas ?? 0}</Text>
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-2 h-2 rounded-full bg-blue-500 mr-2`} />
                    <Text style={tw`text-xs font-bold text-gray-600`}>
                      Admin: <Text style={tw`font-black text-gray-900`}>{summaryData?.users?.admin ?? 0}</Text>
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-2 h-2 rounded-full bg-red-500 mr-2`} />
                    <Text style={tw`text-xs font-bold text-gray-600`}>
                      Super Admin: <Text style={tw`font-black text-gray-900`}>{summaryData?.users?.superAdmin ?? 0}</Text>
                    </Text>
                  </View>
                </View>

                {/* PUSAT KENDALI MODUL (Full-Width Cards Identik dengan AdminDashboard) */}
                <View style={tw`mb-2`}>
                  <Text style={tw`text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1`}>
                    MANAJEMEN PENGGUNA & HAK AKSES
                  </Text>

                  {/* 1. Daftar Admin Full Width Card (Khusus Super Admin) */}
                  <TouchableOpacity
                    style={[
                      tw`w-full p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] border border-white/60 mb-4 flex-row items-center justify-between`,
                      { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.1, shadowRadius: 20 },
                      Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                    ]}
                    onPress={() => navigation.navigate('AdminList')}
                    activeOpacity={0.8}
                  >
                    <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                      <View style={tw`w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full items-center justify-center mr-3.5 sm:mr-4 shrink-0`}>
                        <Feather name="user-check" size={24} color="#0055A5" />
                      </View>
                      <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                        <Text style={tw`text-lg sm:text-2xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                          Daftar Admin
                        </Text>
                        <Text style={tw`text-[10px] sm:text-xs text-blue-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                          Manajemen Akses & Staf Admin
                        </Text>
                      </View>
                    </View>
                    <View style={tw`w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-full items-center justify-center shrink-0`}>
                      <Feather name="chevron-right" size={20} color="#0055A5" />
                    </View>
                  </TouchableOpacity>

                  {/* 2. Daftar Pengawas Full Width Card (Khusus Super Admin) */}
                  <TouchableOpacity
                    style={[
                      tw`w-full p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] border border-white/60 mb-4 flex-row items-center justify-between`,
                      { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#F59E0B', shadowOpacity: 0.1, shadowRadius: 20 },
                      Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                    ]}
                    onPress={() => navigation.navigate('PengawasList')}
                    activeOpacity={0.8}
                  >
                    <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                      <View style={tw`w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-full items-center justify-center mr-3.5 sm:mr-4 shrink-0`}>
                        <Feather name="shield" size={24} color="#F59E0B" />
                      </View>
                      <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                        <Text style={tw`text-lg sm:text-2xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                          Daftar Pengawas
                        </Text>
                        <Text style={tw`text-[10px] sm:text-xs text-orange-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                          Manajemen Akun Pengawas Distribusi
                        </Text>
                      </View>
                    </View>
                    <View style={tw`w-9 h-9 sm:w-10 sm:h-10 bg-orange-50 rounded-full items-center justify-center shrink-0`}>
                      <Feather name="chevron-right" size={20} color="#F59E0B" />
                    </View>
                  </TouchableOpacity>

                  {/* 3. Daftar Pekerja / AMT Full Width Card */}
                  <TouchableOpacity
                    style={[
                      tw`w-full p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] border border-white/60 mb-4 flex-row items-center justify-between`,
                      { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.1, shadowRadius: 20 },
                      Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                    ]}
                    onPress={() => navigation.navigate('WorkerList')}
                    activeOpacity={0.8}
                  >
                    <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                      <View style={tw`w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full items-center justify-center mr-3.5 sm:mr-4 shrink-0`}>
                        <Feather name="users" size={22} color="#00A651" />
                      </View>
                      <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                        <Text style={tw`text-lg sm:text-2xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                          Daftar Pekerja (AMT)
                        </Text>
                        <Text style={tw`text-[10px] sm:text-xs text-green-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                          Manajemen Akun Awak Mobil Tangki
                        </Text>
                      </View>
                    </View>
                    <View style={tw`w-9 h-9 sm:w-10 sm:h-10 bg-green-50 rounded-full items-center justify-center shrink-0`}>
                      <Feather name="chevron-right" size={20} color="#00A651" />
                    </View>
                  </TouchableOpacity>

                  {/* 4. Audit Log Sistem Full Width Card */}
                  <TouchableOpacity
                    style={[
                      tw`w-full p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] border border-white/60 mb-4 flex-row items-center justify-between`,
                      { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.1, shadowRadius: 20 },
                      Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                    ]}
                    onPress={() => navigation.navigate('AuditLog')}
                    activeOpacity={0.8}
                  >
                    <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                      <View style={tw`w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full items-center justify-center mr-3.5 sm:mr-4 shrink-0`}>
                        <Feather name="clipboard" size={24} color="#0055A5" />
                      </View>
                      <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                        <Text style={tw`text-lg sm:text-2xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                          Audit Log Sistem
                        </Text>
                        <Text style={tw`text-[10px] sm:text-xs text-blue-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                          Monitoring & Riwayat Aktivitas Keamanan
                        </Text>
                      </View>
                    </View>
                    <View style={tw`w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-full items-center justify-center shrink-0`}>
                      <Feather name="chevron-right" size={20} color="#0055A5" />
                    </View>
                  </TouchableOpacity>

                  {/* 5. Manajer Checklist Full Width Card */}
                  <TouchableOpacity
                    style={[
                      tw`w-full p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] border border-white/60 mb-4 flex-row items-center justify-between`,
                      { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.1, shadowRadius: 20 },
                      Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                    ]}
                    onPress={() => navigation.navigate('ChecklistManager')}
                    activeOpacity={0.8}
                  >
                    <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                      <View style={tw`w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full items-center justify-center mr-3.5 sm:mr-4 shrink-0`}>
                        <Feather name="check-square" size={24} color="#00A651" />
                      </View>
                      <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                        <Text style={tw`text-lg sm:text-2xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                          Manajer Checklist
                        </Text>
                        <Text style={tw`text-[10px] sm:text-xs text-green-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                          Konfigurasi Pertanyaan Inspeksi
                        </Text>
                      </View>
                    </View>
                    <View style={tw`w-9 h-9 sm:w-10 sm:h-10 bg-green-50 rounded-full items-center justify-center shrink-0`}>
                      <Feather name="chevron-right" size={20} color="#00A651" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Arsip Database / Seluruh Laporan Gradient Card (Identik dengan Admin) */}
                <TouchableOpacity
                  style={tw`w-full mb-8`}
                  onPress={() => navigation.navigate('History')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={PERTAMINA_BLUE}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`p-8 rounded-[40px] shadow-2xl shadow-blue-500/40 relative overflow-hidden`}
                  >
                    <View style={tw`absolute -right-10 -top-10 opacity-20 pointer-events-none`}>
                      <Ionicons name="documents" size={200} color="white" />
                    </View>
                    <View style={tw`w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-8 border border-white/30 shadow-sm`}>
                      <Feather name="database" size={32} color="white" />
                    </View>
                    <Text style={tw`text-blue-200 font-bold text-sm uppercase tracking-widest mb-2`}>
                      Arsip Database
                    </Text>
                    <Text style={tw`text-white font-black text-3xl tracking-tight`}>
                      Lihat Seluruh Laporan
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Aktivitas Audit Terkini */}
                <View style={tw`mb-8`}>
                  <View style={tw`flex-row justify-between items-center mb-5`}>
                    <Text style={tw`text-2xl font-black text-gray-800 tracking-tight`}>
                      Aktivitas Audit Terkini
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveTab('audit')}
                      style={tw`bg-blue-100 px-4 py-1.5 rounded-full`}
                    >
                      <Text style={tw`text-blue-600 text-xs font-black uppercase tracking-widest`}>
                        Lihat Semua →
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {summaryData?.auditLogs?.recent && summaryData.auditLogs.recent.length > 0 ? (
                    <View
                      style={[
                        tw`w-full`,
                        Platform.OS === 'web' && isLargeScreen ? {
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: 16,
                          width: '100%'
                        } : (isLargeScreen ? tw`flex-row flex-wrap justify-between` : tw`flex-col`)
                      ]}
                    >
                      {summaryData.auditLogs.recent.map((log) => (
                        <TouchableOpacity
                          key={log.id}
                          activeOpacity={0.85}
                          onPress={() => setSelectedLogDetail(log)}
                          style={[
                            tw`p-4 rounded-3xl border border-white/70 justify-between ${Platform.OS === 'web' && isLargeScreen ? '' : 'mb-4'}`,
                            {
                              backgroundColor: 'rgba(255,255,255,0.85)',
                              ...glassStyle,
                              shadowColor: '#0055A5',
                              shadowOpacity: 0.08,
                              shadowRadius: 16,
                              shadowOffset: { width: 0, height: 6 },
                              minHeight: 130,
                              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {})
                            }
                          ]}
                        >
                          <View style={tw`flex-row items-center mb-2`}>
                            <View style={tw`w-10 h-10 rounded-2xl bg-blue-100/90 items-center justify-center mr-3 border border-blue-200/80`}>
                              <Feather name="shield" size={20} color="#0055A5" />
                            </View>
                            <View style={tw`flex-1 min-w-0`}>
                              <View style={tw`flex-row justify-between items-center mb-0.5`}>
                                <Text style={tw`text-sm font-black text-gray-800 tracking-wide`} numberOfLines={1}>
                                  {log.action}
                                </Text>
                                <Text style={tw`text-[10px] text-gray-400 font-bold ml-2 shrink-0`}>
                                  {formatDate(log.createdAt)}
                                </Text>
                              </View>
                              <Text style={tw`text-xs text-gray-500 font-semibold`} numberOfLines={1}>
                                Oleh: <Text style={tw`font-bold text-gray-800`}>{log.actor?.name || log.actor?.username || 'Sistem'}</Text> ({log.actor?.role || '-'})
                              </Text>
                            </View>
                          </View>

                          <View style={tw`mt-2 px-3 py-2 rounded-xl bg-gray-50/80 border border-gray-200/60 flex-row items-center justify-between`}>
                            <Text style={tw`text-[11px] text-gray-600 font-medium flex-1 mr-2`} numberOfLines={1}>
                              {log.details || 'Tidak ada detail tambahan'}
                            </Text>
                            <View style={tw`flex-row items-center`}>
                              <Text style={tw`text-[10px] font-bold text-blue-600 mr-1`}>Detail</Text>
                              <Feather name="chevron-right" size={12} color="#0055A5" />
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={[tw`items-center justify-center py-12 px-6 rounded-[35px] border border-white/60`, { backgroundColor: 'rgba(255,255,255,0.6)', ...glassStyle }]}>
                      <View style={tw`w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4`}>
                        <Feather name="inbox" size={40} color="#9CA3AF" />
                      </View>
                      <Text style={tw`text-gray-800 font-black text-xl tracking-tight`}>Belum Ada Aktivitas Audit</Text>
                      <Text style={tw`text-gray-500 text-center text-xs mt-2 font-semibold px-4`}>Catatan audit aktivitas keamanan sistem akan muncul di sini.</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 2: MANAJEMEN PENGGUNA & ROLE                             */}
            {/* ============================================================ */}
            {activeTab === 'users' && (
              <View style={tw`flex-col gap-4`}>
                {/* Search & Filter Header */}
                <View style={[tw`p-4 sm:p-5 rounded-[28px] border border-white/80 shadow-sm`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle }]}>
                  <View style={tw`flex-row flex-wrap items-center gap-2 mb-3`}>
                    <View style={tw`flex-1 min-w-[200px] flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5`}>
                      <Feather name="search" size={16} color="#9CA3AF" style={tw`mr-2`} />
                      <TextInput
                        placeholder="Cari nama, username, jabatan..."
                        value={userSearch}
                        onChangeText={(txt) => setUserSearch(txt)}
                        style={tw`flex-1 text-xs sm:text-sm text-gray-800`}
                        returnKeyType="search"
                        onSubmitEditing={() => fetchUsers(1)}
                      />
                      {userSearch.length > 0 && (
                        <TouchableOpacity onPress={() => { setUserSearch(''); fetchUsers(1); }}>
                          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => fetchUsers(1)}
                      style={[tw`bg-[#0055A5] px-5 py-3 rounded-2xl shadow-sm`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                    >
                      <Text style={tw`text-white font-bold text-xs`}>Cari Pengguna</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Filter Pills */}
                  <View style={tw`flex-row flex-wrap items-center gap-2 pt-2 border-t border-gray-100`}>
                    <Text style={tw`text-xs font-bold text-gray-400 mr-1`}>Role:</Text>
                    {['ALL', 'SUPER_ADMIN', 'ADMIN', 'PENGAWAS', 'AMT'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => { setUserRoleFilter(r); }}
                        style={[
                          tw`px-3 py-1.5 rounded-xl border text-xs`,
                          userRoleFilter === r
                            ? tw`bg-blue-50 border-blue-400`
                            : tw`bg-gray-50 border-gray-200`
                        ]}
                      >
                        <Text style={[tw`text-[11px] font-bold`, userRoleFilter === r ? tw`text-[#0055A5]` : tw`text-gray-600`]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <View style={tw`w-[1px] h-4 bg-gray-200 mx-1`} />

                    <Text style={tw`text-xs font-bold text-gray-400 mr-1`}>Status:</Text>
                    {[
                      { key: 'all', label: 'Semua' },
                      { key: 'active', label: 'Aktif' },
                      { key: 'inactive', label: 'Nonaktif' }
                    ].map((s) => (
                      <TouchableOpacity
                        key={s.key}
                        onPress={() => { setUserStatusFilter(s.key); }}
                        style={[
                          tw`px-3 py-1.5 rounded-xl border text-xs`,
                          userStatusFilter === s.key
                            ? tw`bg-blue-50 border-blue-400`
                            : tw`bg-gray-50 border-gray-200`
                        ]}
                      >
                        <Text style={[tw`text-[11px] font-bold`, userStatusFilter === s.key ? tw`text-[#0055A5]` : tw`text-gray-600`]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Users List Cards */}
                <View style={[tw`p-4 sm:p-5 rounded-[28px] border border-white/80 shadow-sm`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle }]}>
                  <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={tw`text-sm font-black text-gray-800`}>
                      Daftar Akun Pengguna ({userPagination.total} ditemukan)
                    </Text>
                    <Text style={tw`text-xs font-bold text-gray-400`}>
                      Halaman {userPage} dari {userPagination.totalPages || 1}
                    </Text>
                  </View>

                  {usersLoading ? (
                    <View style={tw`py-12 items-center justify-center`}>
                      <ActivityIndicator size="small" color="#0055A5" />
                      <Text style={tw`text-gray-400 text-xs mt-2`}>Memuat data pengguna...</Text>
                    </View>
                  ) : usersList.length === 0 ? (
                    <View style={tw`py-10 items-center justify-center`}>
                      <Feather name="user-x" size={32} color="#9CA3AF" />
                      <Text style={tw`text-gray-600 font-bold text-sm mt-2`}>Tidak ada pengguna yang cocok</Text>
                      <Text style={tw`text-gray-400 text-xs mt-0.5`}>Coba sesuaikan kata kunci atau filter status.</Text>
                    </View>
                  ) : (
                    <View style={tw`divide-y divide-gray-100`}>
                      {usersList.map((item) => {
                        const isSelf = user?.id === item.id;
                        const isItemActive = item.status === 'ACTIVE';

                        return (
                          <View key={item.id} style={tw`py-3.5 flex-row flex-wrap items-center justify-between gap-3`}>
                            <View style={tw`flex-1 min-w-[200px]`}>
                              <View style={tw`flex-row items-center gap-2 mb-1`}>
                                <Text style={tw`font-bold text-sm text-gray-900`}>{item.name}</Text>
                                <View
                                  style={[
                                    tw`px-2 py-0.5 rounded-full`,
                                    item.role === 'SUPER_ADMIN' ? tw`bg-red-50 border border-red-200` :
                                    item.role === 'ADMIN' ? tw`bg-blue-50 border border-blue-200` :
                                    item.role === 'PENGAWAS' ? tw`bg-purple-50 border border-purple-200` :
                                    tw`bg-emerald-50 border border-emerald-200`
                                  ]}
                                >
                                  <Text
                                    style={[
                                      tw`text-[10px] font-black`,
                                      item.role === 'SUPER_ADMIN' ? tw`text-red-700` :
                                      item.role === 'ADMIN' ? tw`text-blue-700` :
                                      item.role === 'PENGAWAS' ? tw`text-purple-700` :
                                      tw`text-emerald-700`
                                    ]}
                                  >
                                    {item.role}
                                  </Text>
                                </View>
                                {isSelf && (
                                  <View style={tw`px-1.5 py-0.5 rounded bg-gray-200`}>
                                    <Text style={tw`text-[9px] font-bold text-gray-700`}>SAYA</Text>
                                  </View>
                                )}
                              </View>

                              <Text style={tw`text-xs text-gray-500`}>
                                Username: <Text style={tw`font-bold text-gray-700`}>{item.username}</Text> • Jabatan: {item.jabatan || '-'}
                              </Text>

                              <View style={tw`flex-row items-center gap-2 mt-1`}>
                                <View style={tw`flex-row items-center`}>
                                  <View style={[tw`w-2 h-2 rounded-full mr-1.5`, isItemActive ? tw`bg-[#00A651]` : tw`bg-gray-400`]} />
                                  <Text style={[tw`text-[11px] font-bold`, isItemActive ? tw`text-emerald-700` : tw`text-gray-500`]}>
                                    {isItemActive ? 'Aktif' : 'Dinonaktifkan'}
                                  </Text>
                                </View>
                                <Text style={tw`text-[10px] text-gray-400`}>
                                  Terdaftar: {formatDate(item.createdAt)}
                                </Text>
                              </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={tw`flex-row items-center gap-2`}>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedUserForRole(item);
                                  setNewSelectedRole(item.role);
                                  setRoleModalVisible(true);
                                }}
                                style={[
                                  tw`px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex-row items-center`,
                                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                                ]}
                                activeOpacity={0.7}
                              >
                                <Feather name="shield" size={13} color="#0055A5" style={tw`mr-1`} />
                                <Text style={tw`text-xs font-bold text-[#0055A5]`}>Ubah Role</Text>
                              </TouchableOpacity>

                              {!isSelf ? (
                                <TouchableOpacity
                                  onPress={() => {
                                    setSelectedUserForStatus(item);
                                    setStatusModalVisible(true);
                                  }}
                                  style={[
                                    tw`px-3 py-1.5 rounded-xl border flex-row items-center`,
                                    isItemActive
                                      ? tw`bg-red-50 border-red-200`
                                      : tw`bg-emerald-50 border-emerald-200`,
                                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                                  ]}
                                  activeOpacity={0.7}
                                >
                                  <Feather
                                    name={isItemActive ? 'user-x' : 'user-check'}
                                    size={13}
                                    color={isItemActive ? '#B30000' : '#007A3E'}
                                    style={tw`mr-1`}
                                  />
                                  <Text style={[tw`text-xs font-bold`, isItemActive ? tw`text-[#B30000]` : tw`text-[#007A3E]`]}>
                                    {isItemActive ? 'Nonaktifkan' : 'Aktifkan'}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={tw`px-3 py-1.5 rounded-xl bg-gray-100`}>
                                  <Text style={tw`text-xs font-semibold text-gray-400`}>Akun Saya</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Pagination */}
                  {userPagination.totalPages > 1 && (
                    <View style={tw`flex-row items-center justify-between pt-4 mt-2 border-t border-gray-100`}>
                      <TouchableOpacity
                        disabled={userPage <= 1}
                        onPress={() => fetchUsers(userPage - 1)}
                        style={[
                          tw`px-3 py-1.5 rounded-xl border`,
                          userPage <= 1 ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                        ]}
                      >
                        <Text style={tw`text-xs font-bold text-gray-700`}>← Sebelumnya</Text>
                      </TouchableOpacity>

                      <Text style={tw`text-xs font-medium text-gray-500`}>
                        {userPage} / {userPagination.totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={userPage >= userPagination.totalPages}
                        onPress={() => fetchUsers(userPage + 1)}
                        style={[
                          tw`px-3 py-1.5 rounded-xl border`,
                          userPage >= userPagination.totalPages ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                        ]}
                      >
                        <Text style={tw`text-xs font-bold text-gray-700`}>Berikutnya →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 3: AUDIT LOG AKTIVITAS (SECURITY LOGS)                    */}
            {/* ============================================================ */}
            {activeTab === 'audit' && (
              <View style={tw`flex-col gap-4`}>
                {/* Search & Filter Header */}
                <View style={[tw`p-4 sm:p-5 rounded-[28px] border border-white/80 shadow-sm`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle }]}>
                  <View style={tw`flex-row flex-wrap items-center gap-2 mb-3`}>
                    <View style={tw`flex-1 min-w-[200px] flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5`}>
                      <Feather name="search" size={16} color="#9CA3AF" style={tw`mr-2`} />
                      <TextInput
                        placeholder="Cari aksi, detail, nopol, aktor..."
                        value={auditSearch}
                        onChangeText={(txt) => setAuditSearch(txt)}
                        style={tw`flex-1 text-xs sm:text-sm text-gray-800`}
                        returnKeyType="search"
                        onSubmitEditing={() => fetchAuditLogs(1)}
                      />
                      {auditSearch.length > 0 && (
                        <TouchableOpacity onPress={() => { setAuditSearch(''); fetchAuditLogs(1); }}>
                          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => fetchAuditLogs(1)}
                      style={[tw`bg-[#0055A5] px-5 py-3 rounded-2xl shadow-sm`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                    >
                      <Text style={tw`text-white font-bold text-xs`}>Cari Audit</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Kategori Filters */}
                  <View style={tw`flex-row flex-wrap items-center gap-2 pt-2 border-t border-gray-100`}>
                    <Text style={tw`text-xs font-bold text-gray-400 mr-1`}>Kategori:</Text>
                    {[
                      { key: '', label: 'Semua' },
                      { key: 'USER_MANAGEMENT', label: 'User Management' },
                      { key: 'HANDOVER', label: 'Handover' },
                      { key: 'CHECKLIST', label: 'Checklist' },
                      { key: 'VEHICLE', label: 'Kendaraan' },
                      { key: 'PASSWORD_RESET', label: 'Password Reset' },
                      { key: 'FORCE_RELEASE', label: 'Force Release' },
                      { key: 'SECURITY', label: 'Keamanan' }
                    ].map((f) => (
                      <TouchableOpacity
                        key={f.key}
                        onPress={() => { setAuditActionFilter(f.key); }}
                        style={[
                          tw`px-3 py-1.5 rounded-xl border text-xs`,
                          auditActionFilter === f.key
                            ? tw`bg-blue-50 border-blue-400`
                            : tw`bg-gray-50 border-gray-200`
                        ]}
                      >
                        <Text style={[tw`text-[11px] font-bold`, auditActionFilter === f.key ? tw`text-[#0055A5]` : tw`text-gray-600`]}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Audit Logs Table */}
                <View style={[tw`p-4 sm:p-5 rounded-[28px] border border-white/80 shadow-sm`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle }]}>
                  <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={tw`text-sm font-black text-gray-800`}>
                      Riwayat Audit Sistem ({auditPagination.total} entri)
                    </Text>
                    <Text style={tw`text-xs font-bold text-gray-400`}>
                      Halaman {auditPage} dari {auditPagination.totalPages || 1}
                    </Text>
                  </View>

                  {auditLoading ? (
                    <View style={tw`py-12 items-center justify-center`}>
                      <ActivityIndicator size="small" color="#0055A5" />
                      <Text style={tw`text-gray-400 text-xs mt-2`}>Memuat catatan audit log...</Text>
                    </View>
                  ) : auditLogs.length === 0 ? (
                    <View style={tw`py-10 items-center justify-center`}>
                      <Feather name="shield" size={32} color="#9CA3AF" />
                      <Text style={tw`text-gray-600 font-bold text-sm mt-2`}>Tidak ada catatan audit</Text>
                      <Text style={tw`text-gray-400 text-xs mt-0.5`}>Coba sesuaikan kata kunci atau kategori filter.</Text>
                    </View>
                  ) : (
                    <View style={tw`divide-y divide-gray-100`}>
                      {auditLogs.map((log) => (
                        <TouchableOpacity
                          key={log.id}
                          onPress={() => setSelectedLogDetail(log)}
                          style={[tw`py-3.5 flex-row items-start justify-between`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`flex-1 mr-3`}>
                            <View style={tw`flex-row items-center gap-2 flex-wrap mb-1`}>
                              <View style={tw`px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200`}>
                                <Text style={tw`text-[11px] font-black text-blue-800`}>{log.action}</Text>
                              </View>
                              {log.actionType && (
                                <View style={tw`px-2 py-0.5 rounded-lg bg-gray-100`}>
                                  <Text style={tw`text-[10px] font-semibold text-gray-600`}>{log.actionType}</Text>
                                </View>
                              )}
                              {log.noPolisi && (
                                <View style={tw`px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200`}>
                                  <Text style={tw`text-[10px] font-bold text-amber-800`}>{log.noPolisi}</Text>
                                </View>
                              )}
                            </View>

                            <Text style={tw`text-xs text-gray-600 font-medium`}>
                              Aktor: <Text style={tw`font-bold text-gray-900`}>{log.actor?.name || log.actor?.username || 'Sistem'}</Text>{' '}
                              <Text style={tw`text-gray-400`}>({log.actor?.role || '-'})</Text>
                            </Text>

                            {log.details && (
                              <Text style={tw`text-xs text-gray-500 mt-1 font-mono`} numberOfLines={2}>
                                {log.details}
                              </Text>
                            )}
                          </View>

                          <View style={tw`items-end`}>
                            <Text style={tw`text-[11px] text-gray-400 font-medium`}>
                              {formatDate(log.createdAt)}
                            </Text>
                            <Feather name="chevron-right" size={14} color="#9CA3AF" style={tw`mt-2`} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Pagination */}
                  {auditPagination.totalPages > 1 && (
                    <View style={tw`flex-row items-center justify-between pt-4 mt-2 border-t border-gray-100`}>
                      <TouchableOpacity
                        disabled={auditPage <= 1}
                        onPress={() => fetchAuditLogs(auditPage - 1)}
                        style={[
                          tw`px-3 py-1.5 rounded-xl border`,
                          auditPage <= 1 ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                        ]}
                      >
                        <Text style={tw`text-xs font-bold text-gray-700`}>← Sebelumnya</Text>
                      </TouchableOpacity>

                      <Text style={tw`text-xs font-medium text-gray-500`}>
                        {auditPage} / {auditPagination.totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={auditPage >= auditPagination.totalPages}
                        onPress={() => fetchAuditLogs(auditPage + 1)}
                        style={[
                          tw`px-3 py-1.5 rounded-xl border`,
                          auditPage >= auditPagination.totalPages ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                        ]}
                      >
                        <Text style={tw`text-xs font-bold text-gray-700`}>Berikutnya →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY - Sama persis Admin Mobile) */}
        {!isLargeScreen && (
          <View style={tw`absolute bottom-8 self-center w-11/12 bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50`}>
            {/* 1. Beranda / Dashboard */}
            <TouchableOpacity
              style={tw`items-center justify-center px-3 relative`}
              onPress={() => {
                setActiveTab('overview');
                setActiveMenu('Home');
              }}
            >
              {activeMenu === 'Home' && !isLogoutVisible && (
                <>
                  <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                  <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                </>
              )}
              <Feather name="grid" size={24} color={activeMenu === 'Home' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'} />
            </TouchableOpacity>

            {/* 2. Manajer Checklist */}
            <TouchableOpacity
              style={tw`items-center justify-center px-3 relative`}
              onPress={() => navigation.navigate('ChecklistManager')}
            >
              {activeMenu === 'Checklist' && !isLogoutVisible && (
                <>
                  <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                  <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                </>
              )}
              <Feather name="check-square" size={24} color={activeMenu === 'Checklist' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'} />
            </TouchableOpacity>

            {/* 3. Audit Log Sistem */}
            <TouchableOpacity
              style={tw`items-center justify-center px-3 relative`}
              onPress={() => navigation.navigate('AuditLog')}
            >
              {activeMenu === 'AuditLog' && !isLogoutVisible && (
                <>
                  <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                  <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                </>
              )}
              <Feather name="clipboard" size={24} color={activeMenu === 'AuditLog' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'} />
            </TouchableOpacity>

            {/* 4. Notifikasi / Messages */}
            <TouchableOpacity
              style={tw`items-center justify-center px-3 relative`}
              onPress={() => navigation.navigate('MessageCenter')}
            >
              {activeMenu === 'Messages' && !isLogoutVisible && (
                <>
                  <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                  <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                </>
              )}
              <View style={tw`relative`}>
                <Ionicons name="chatbubble-ellipses-outline" size={25} color={activeMenu === 'Messages' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'} />
                {unreadNotificationsCount > 0 && (
                  <View style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] min-h-[18px] items-center justify-center border border-white px-[2px]`}>
                    <Text style={tw`text-white text-[10px] font-bold`}>{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* 5. Keluar / Logout */}
            <TouchableOpacity style={tw`items-center justify-center px-3 relative`} onPress={handleLogout}>
              {activeMenu === 'Logout' && (
                <>
                  <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                  <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                </>
              )}
              <Feather name="log-out" size={24} color={activeMenu === 'Logout' ? '#ED1C24' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* ============================================================ */}
      {/* MODAL 1: UBAH ROLE PENGGUNA                                  */}
      {/* ============================================================ */}
      <Modal visible={roleModalVisible} transparent animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <View style={tw`flex-1 bg-black/60 justify-center items-center px-4 sm:px-6`}>
          <View style={tw`bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100`}>
            <View style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-10 h-10 rounded-2xl bg-blue-100 items-center justify-center`}>
                  <Feather name="shield" size={20} color="#0055A5" />
                </View>
                <Text style={tw`font-black text-lg text-gray-900`}>Ubah Role Akun</Text>
              </View>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedUserForRole && (
              <View style={tw`mb-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-100`}>
                <Text style={tw`text-xs text-gray-400 font-bold uppercase tracking-wider`}>Akun Pengguna:</Text>
                <Text style={tw`text-base font-black text-gray-900 mt-0.5`}>{selectedUserForRole.name}</Text>
                <Text style={tw`text-xs text-gray-500 mt-0.5`}>
                  @{selectedUserForRole.username} • Role saat ini: <Text style={tw`font-black text-[#0055A5]`}>{selectedUserForRole.role}</Text>
                </Text>
              </View>
            )}

            <Text style={tw`text-xs font-black text-gray-700 mb-2 uppercase tracking-wider`}>Pilih Role Baru:</Text>
            <View style={tw`gap-2 mb-5`}>
              {[
                { role: 'AMT', label: 'AMT (Awak Mobil Tangki)', desc: 'Pelaksana inspeksi & serah terima unit' },
                { role: 'PENGAWAS', label: 'PENGAWAS', desc: 'Monitoring operasional & verifikasi isu' },
                { role: 'ADMIN', label: 'ADMIN', desc: 'Pengelolaan operasional data dan checklist' },
                { role: 'SUPER_ADMIN', label: 'SUPER_ADMIN', desc: 'Wewenang penuh kendali seluruh sistem' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.role}
                  onPress={() => setNewSelectedRole(item.role)}
                  style={[
                    tw`p-3.5 rounded-2xl border flex-row items-center justify-between`,
                    newSelectedRole === item.role
                      ? tw`bg-blue-50/80 border-[#0055A5]`
                      : tw`bg-gray-50 border-gray-200`
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-black text-sm`, newSelectedRole === item.role ? tw`text-[#0055A5]` : tw`text-gray-800`]}>
                      {item.label}
                    </Text>
                    <Text style={tw`text-[11px] text-gray-500 mt-0.5 font-medium`}>{item.desc}</Text>
                  </View>
                  {newSelectedRole === item.role && (
                    <Ionicons name="checkmark-circle" size={22} color="#0055A5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={tw`flex-row items-center justify-end gap-2`}>
              <TouchableOpacity
                onPress={() => setRoleModalVisible(false)}
                style={tw`px-4 py-3 rounded-xl border border-gray-200 bg-gray-50`}
              >
                <Text style={tw`text-xs font-bold text-gray-700`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={roleUpdating}
                onPress={handleUpdateRole}
                style={tw`px-5 py-3 rounded-xl bg-[#0055A5] flex-row items-center shadow-md shadow-blue-900/30`}
              >
                {roleUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={tw`text-xs font-black text-white`}>Simpan Role</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: KONFIRMASI STATUS TOGGLE                            */}
      {/* ============================================================ */}
      <Modal visible={statusModalVisible} transparent animationType="fade" onRequestClose={() => setStatusModalVisible(false)}>
        <View style={tw`flex-1 bg-black/60 justify-center items-center px-4 sm:px-6`}>
          <View style={tw`bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100`}>
            {selectedUserForStatus && (
              <>
                <View style={tw`w-14 h-14 rounded-full ${selectedUserForStatus.status === 'ACTIVE' ? 'bg-red-100' : 'bg-emerald-100'} items-center justify-center mx-auto mb-3`}>
                  <Feather
                    name={selectedUserForStatus.status === 'ACTIVE' ? 'user-x' : 'user-check'}
                    size={26}
                    color={selectedUserForStatus.status === 'ACTIVE' ? '#ED1C24' : '#00A651'}
                  />
                </View>
                <Text style={tw`text-center font-black text-lg text-gray-900`}>
                  {selectedUserForStatus.status === 'ACTIVE' ? 'Nonaktifkan Akun?' : 'Aktifkan Akun Kembali?'}
                </Text>
                <Text style={tw`text-center text-xs text-gray-500 mt-1 mb-5 px-2`}>
                  {selectedUserForStatus.status === 'ACTIVE'
                    ? `Akun ${selectedUserForStatus.name} (@${selectedUserForStatus.username}) tidak akan dapat login ke sistem.`
                    : `Akun ${selectedUserForStatus.name} (@${selectedUserForStatus.username}) akan dapat login kembali.`}
                </Text>

                <View style={tw`flex-row items-center gap-2`}>
                  <TouchableOpacity
                    onPress={() => setStatusModalVisible(false)}
                    style={tw`flex-1 py-3 rounded-xl border border-gray-200 bg-gray-50 items-center`}
                  >
                    <Text style={tw`text-xs font-bold text-gray-700`}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={statusUpdating}
                    onPress={handleToggleStatus}
                    style={[
                      tw`flex-1 py-3 rounded-xl items-center shadow-md`,
                      selectedUserForStatus.status === 'ACTIVE' ? tw`bg-[#ED1C24] shadow-red-500/30` : tw`bg-[#00A651] shadow-green-500/30`
                    ]}
                  >
                    {statusUpdating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={tw`text-xs font-black text-white`}>
                        {selectedUserForStatus.status === 'ACTIVE' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: DETAIL AUDIT LOG                                    */}
      {/* ============================================================ */}
      <Modal visible={!!selectedLogDetail} transparent animationType="fade" onRequestClose={() => setSelectedLogDetail(null)}>
        <View style={tw`flex-1 bg-black/60 justify-center items-center px-4 sm:px-6`}>
          <View style={tw`bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100`}>
            <View style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-10 h-10 rounded-2xl bg-blue-100 items-center justify-center`}>
                  <Feather name="shield" size={20} color="#0055A5" />
                </View>
                <Text style={tw`font-black text-lg text-gray-900`}>Rincian Audit Log</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedLogDetail(null)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedLogDetail && (
              <ScrollView style={tw`max-h-96`}>
                <View style={tw`gap-3`}>
                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>AKSI & KATEGORI</Text>
                    <Text style={tw`text-base font-black text-gray-900 mt-0.5`}>
                      {selectedLogDetail.action} {selectedLogDetail.actionType ? `(${selectedLogDetail.actionType})` : ''}
                    </Text>
                  </View>

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>AKTOR</Text>
                    <Text style={tw`text-xs font-bold text-gray-800 mt-0.5`}>
                      {selectedLogDetail.actor?.name || '-'} (@{selectedLogDetail.actor?.username || '-'}) — Role: {selectedLogDetail.actor?.role || '-'}
                    </Text>
                  </View>

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>WAKTU PENCATATAN</Text>
                    <Text style={tw`text-xs font-semibold text-gray-800 mt-0.5`}>
                      {formatDate(selectedLogDetail.createdAt)}
                    </Text>
                  </View>

                  {selectedLogDetail.noPolisi && (
                    <View>
                      <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>NOMOR POLISI TERKAIT</Text>
                      <Text style={tw`text-xs font-black text-gray-900 mt-0.5`}>{selectedLogDetail.noPolisi}</Text>
                    </View>
                  )}

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400 uppercase tracking-wider`}>PAYLOAD / DETAIL</Text>
                    <View style={tw`bg-gray-50 p-3.5 rounded-2xl border border-gray-200 mt-1`}>
                      <Text style={tw`font-mono text-xs text-gray-800 leading-relaxed`}>
                        {(() => {
                          try {
                            const parsed = JSON.parse(selectedLogDetail.details);
                            return JSON.stringify(parsed, null, 2);
                          } catch (_) {
                            return selectedLogDetail.details || 'Tidak ada detail tambahan';
                          }
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={tw`mt-4 pt-3 border-t border-gray-100 items-end`}>
              <TouchableOpacity
                onPress={() => setSelectedLogDetail(null)}
                style={tw`px-5 py-2.5 rounded-xl bg-gray-100`}
              >
                <Text style={tw`text-xs font-bold text-gray-700`}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 4: KONFIRMASI LOGOUT (Identik dengan AdminDashboard)   */}
      {/* ============================================================ */}
      <Modal
        visible={isLogoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-2xl relative overflow-hidden`}>
            <Image
              source={require('../../assets/logo.png')}
              style={[tw`absolute opacity-10`, { width: 250, height: 250, top: -50, right: -50 }]}
              resizeMode="contain"
            />
            <View style={tw`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4`}>
              <Feather name="log-out" size={32} color="#ED1C24" />
            </View>
            <Text style={tw`text-2xl font-black text-gray-800 mb-2`}>Konfirmasi Keluar</Text>
            <Text style={tw`text-center text-gray-500 font-medium mb-8 px-4`}>
              Apakah Anda yakin ingin mengakhiri sesi kendali Super Administrator ini?
            </Text>
            <View style={tw`flex-row w-full`}>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-100 p-4 rounded-xl mr-2 items-center`}
                onPress={handleCancelLogout}
              >
                <Text style={tw`font-bold text-gray-600`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#ED1C24] p-4 rounded-xl ml-2 items-center shadow-lg shadow-red-500/30`}
                onPress={confirmLogout}
              >
                <Text style={tw`font-bold text-white`}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
