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
import MobileBottomNav from '../../components/MobileBottomNav';
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
  const [activeMenu, setActiveMenu] = useState('Home');
  const [previousMenu, setPreviousMenu] = useState('Home');
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Mode Tampilan Statistik: 'operasional' (default, identik screenshot) | 'pengguna'
  const [statMode, setStatMode] = useState('operasional');

  // Operational States (Sama persis dengan AdminDashboardScreen)
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [activeIssuesCount, setActiveIssuesCount] = useState(0);
  const [allHandovers, setAllHandovers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [displayedAlertsCount, setDisplayedAlertsCount] = useState(4);

  // Modal Kelola Pengguna Master (Akses langsung kontrol hak akses tanpa mengacaukan layout beranda)
  const [manageUsersModalVisible, setManageUsersModalVisible] = useState(false);

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

  // Audit Logs State & Detail Modal
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
      setSummaryError(null);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/admins/system-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setSummaryData(res.data.data);
      } else {
        setSummaryError(res.data?.error || 'Gagal memuat ringkasan sistem.');
      }
    } catch (err) {
      console.log('Error fetching system summary:', err.response?.data?.error || err.message);
      setSummaryError(err.response?.data?.error || 'Gagal terhubung ke server.');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // Fetch Operational Alerts & Vehicles
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const vehicleRes = await axios.get(`${API_URL}/api/vehicles`, { headers });
      const activeVehicles = vehicleRes.data || [];
      setVehiclesCount(activeVehicles.length);
      const activePolisi = activeVehicles.map(v => v.noPolisi);

      const res = await axios.get(`${API_URL}/api/handovers`, { headers });
      const dataHandovers = res.data.data || res.data || [];
      setAllHandovers(dataHandovers);

      const issueRes = await axios.get(`${API_URL}/api/issues/ongoing`, { headers });
      const activeIssues = (issueRes.data || []).filter(issue => activePolisi.includes(issue.handover?.noPolisi));
      setActiveIssuesCount(activeIssues.length);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysHandovers = dataHandovers.filter(h => new Date(h.timestamp) >= today);
      setAlerts(todaysHandovers);
    } catch (error) {
      console.log('Gagal mengambil data alert operasional:', error.message);
      if (error.response?.status === 401) {
        await handleLogoutAndReset(navigation);
      }
    } finally {
      setLoadingAlerts(false);
    }
  }, [navigation]);

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
        fetchAlerts(),
        fetchNotifications()
      ]);
    };
    init();
  }, [fetchSummary, fetchAlerts, fetchNotifications, navigation]);

  // Screen focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSummary();
      fetchAlerts();
      fetchNotifications();
    });
    return unsubscribe;
  }, [navigation, fetchSummary, fetchAlerts, fetchNotifications]);

  // Auto fetch users when modal opened or filter changed
  useEffect(() => {
    if (manageUsersModalVisible) {
      fetchUsers(1);
    }
  }, [manageUsersModalVisible, userRoleFilter, userStatusFilter, fetchUsers]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSummary(),
      fetchAlerts(),
      fetchNotifications(),
      manageUsersModalVisible ? fetchUsers(userPage) : null
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

  // Render Alert Item (Identik persis dengan AdminDashboardScreen)
  const renderAlertItem = ({ item }) => {
    const isBad = item.status !== 'Siap Operasi (Normal)' && item.issue?.status !== 'RESOLVED';
    const badItems = item.items ? item.items.filter(i => !i.isGood) : [];
    const issueCount = badItems.length;
    const firstIssue = badItems[0]?.name || 'Kendala operasional';
    const remainingCount = issueCount - 1;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('HandoverDetail', { handover: item, handoverId: item.id })}
        style={[
          tw`p-4 rounded-3xl border border-white/70 justify-between ${Platform.OS === 'web' && isLargeScreen ? '' : 'mb-4'}`,
          {
            backgroundColor: 'rgba(255,255,255,0.85)',
            ...glassStyle,
            shadowColor: isBad ? '#ED1C24' : '#00A651',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            minHeight: 148,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {})
          }
        ]}
      >
        <View style={tw`flex-row items-center`}>
          <View style={[
            tw`w-12 h-12 rounded-2xl items-center justify-center mr-3.5 border`,
            isBad ? tw`bg-red-100/90 border-red-200/80` : tw`bg-emerald-100/90 border-emerald-200/80`
          ]}>
            <Feather name={isBad ? "alert-triangle" : "check-circle"} size={24} color={isBad ? "#ED1C24" : "#059669"} />
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row justify-between items-center mb-0.5`}>
              <Text style={tw`text-lg font-black text-gray-800 tracking-wide`}>{item.noPolisi}</Text>
              <View style={[
                tw`px-3 py-1 rounded-full`,
                isBad ? tw`bg-red-500` : tw`bg-emerald-500`
              ]}>
                <Text style={tw`text-[10px] text-white font-extrabold uppercase tracking-widest`}>
                  {isBad ? 'Ada Isu' : 'Aman'}
                </Text>
              </View>
            </View>
            <Text style={tw`text-xs text-gray-500 font-semibold uppercase tracking-wider`} numberOfLines={1}>
              {item.shift} • {item.user?.name || 'Driver'}
            </Text>
          </View>
        </View>

        <View style={[
          tw`mt-3 px-3.5 py-2.5 rounded-2xl flex-row items-center justify-between border`,
          isBad ? tw`bg-red-50/80 border-red-200/60` : tw`bg-emerald-50/80 border-emerald-200/60`
        ]}>
          <View style={tw`flex-1 mr-2`}>
            <Text style={[
              tw`text-xs font-black tracking-tight`,
              isBad ? tw`text-red-700` : tw`text-emerald-700`
            ]}>
              {isBad ? `⚠️ ${issueCount > 0 ? `${issueCount} Isu Ditemukan` : 'Ada Isu Kendaraan'}` : '✓ Siap Operasi (Normal)'}
            </Text>
            <Text style={[
              tw`text-[11px] font-medium mt-0.5`,
              isBad ? tw`text-red-600` : tw`text-emerald-600`
            ]} numberOfLines={1}>
              {isBad 
                ? `• ${firstIssue}${remainingCount > 0 ? ` (+${remainingCount} lainnya)` : ''}`
                : '• Seluruh item checklist lengkap & sesuai standar'
              }
            </Text>
          </View>
          <View style={[
            tw`flex-row items-center bg-white/90 px-2.5 py-1.5 rounded-xl border shadow-sm`,
            isBad ? tw`border-red-200/80` : tw`border-emerald-200/80`
          ]}>
            <Text style={[
              tw`text-[10px] font-bold mr-0.5`,
              isBad ? tw`text-red-600` : tw`text-emerald-600`
            ]}>Detail</Text>
            <Feather name="chevron-right" size={12} color={isBad ? "#ED1C24" : "#059669"} />
          </View>
        </View>
      </TouchableOpacity>
    );
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
            />
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`${isLargeScreen ? 'p-6 max-w-7xl mx-auto w-full' : 'p-6 pt-6 pb-36 w-full'}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0055A5']} />}
          >
            {/* Title Section (Identik persis dengan screenshot & AdminDashboardScreen) */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text style={tw`text-[11px] font-black text-[#0055A5] uppercase tracking-widest`}>
                  SISTEM TERINTEGRASI PERTAMINA
                </Text>
                <View style={tw`px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 flex-row items-center`}>
                  <Ionicons name="shield-checkmark" size={11} color="#ED1C24" style={tw`mr-1`} />
                  <Text style={tw`text-[10px] font-black text-[#ED1C24] tracking-widest uppercase`}>
                    SUPER ADMIN
                  </Text>
                </View>
              </View>
              <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                Overview <Text style={tw`text-[#ED1C24]`}>Hari Ini.</Text>
              </Text>
            </View>

            {/* Stat Mode Switcher: Operasional vs Pengguna Sistem */}
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={[tw`flex-row p-1 rounded-2xl border border-white/60`, { backgroundColor: 'rgba(255,255,255,0.7)', ...glassStyle }]}>
                <TouchableOpacity
                  onPress={() => setStatMode('operasional')}
                  style={[
                    tw`px-3.5 py-1.5 rounded-xl flex-row items-center`,
                    statMode === 'operasional' ? tw`bg-[#0055A5] shadow-sm` : {},
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="activity" size={12} color={statMode === 'operasional' ? '#FFFFFF' : '#64748B'} style={tw`mr-1.5`} />
                  <Text style={[tw`text-[11px] font-black`, statMode === 'operasional' ? tw`text-white` : tw`text-gray-600`]}>
                    Operasional
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStatMode('pengguna');
                    if (usersList.length === 0) fetchUsers(1);
                  }}
                  style={[
                    tw`px-3.5 py-1.5 rounded-xl flex-row items-center`,
                    statMode === 'pengguna' ? tw`bg-[#0055A5] shadow-sm` : {},
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="users" size={12} color={statMode === 'pengguna' ? '#FFFFFF' : '#64748B'} style={tw`mr-1.5`} />
                  <Text style={[tw`text-[11px] font-black`, statMode === 'pengguna' ? tw`text-white` : tw`text-gray-600`]}>
                    Pengguna Sistem
                  </Text>
                </TouchableOpacity>
              </View>

              {statMode === 'pengguna' && (
                <TouchableOpacity
                  onPress={() => {
                    if (usersList.length === 0) fetchUsers(1);
                    setManageUsersModalVisible(true);
                  }}
                  style={[tw`px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex-row items-center`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                  activeOpacity={0.8}
                >
                  <Feather name="sliders" size={12} color="#0055A5" style={tw`mr-1`} />
                  <Text style={tw`text-[11px] font-black text-[#0055A5]`}>Kelola Role</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* SUPER CARDS */}
            {statMode === 'operasional' ? (
              /* MODE OPERASIONAL: SAMA PERSIS DENGAN SCREENSHOT & AdminDashboardScreen */
              <View style={tw`flex-row justify-between mb-4`}>
                <TouchableOpacity
                  style={[
                    tw`flex-1 p-5 rounded-[28px] border border-white/60 mr-3 justify-between`,
                    { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  onPress={() => navigation.navigate('VehicleList')}
                  activeOpacity={0.8}
                >
                  <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-5`}>
                    <Feather name="truck" size={22} color="#0055A5" />
                  </View>
                  <View>
                    <Text style={tw`text-4xl font-black text-gray-800 tracking-tighter`}>{vehiclesCount}</Text>
                    <Text style={tw`text-[11px] text-gray-500 font-black uppercase tracking-widest mt-1.5`}>Total Kendaraan</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    tw`flex-1 p-5 rounded-[28px] border border-white/60 ml-3 justify-between`,
                    { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.1, shadowRadius: 20 },
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  onPress={() => navigation.navigate('IssueList')}
                  activeOpacity={0.8}
                >
                  <View style={tw`w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-5`}>
                    <Feather name="alert-circle" size={22} color="#ED1C24" />
                  </View>
                  <View>
                    <Text style={tw`text-4xl font-black text-[#ED1C24] tracking-tighter`}>{activeIssuesCount}</Text>
                    <Text style={tw`text-[11px] text-red-400 font-black uppercase tracking-widest mt-1.5`}>Isu Ditemukan</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              /* MODE PENGGUNA SISTEM: 4 KARTU ROLE USER */
              <View
                style={[
                  tw`w-full mb-4`,
                  Platform.OS === 'web' && isLargeScreen
                    ? { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }
                    : tw`flex-row flex-wrap justify-between`
                ]}
              >
                {/* 1. Pekerja AMT */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('WorkerList')}
                  style={[
                    tw`p-4 sm:p-5 rounded-[28px] border border-white/60 justify-between mb-3`,
                    Platform.OS === 'web' && isLargeScreen ? { width: '100%' } : tw`w-[48%]`,
                    { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.08, shadowRadius: 16 },
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={tw`w-11 h-11 bg-emerald-100 rounded-full items-center justify-center mb-3`}>
                    <Feather name="users" size={20} color="#00A651" />
                  </View>
                  <View>
                    <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                      {summaryData?.users?.amt ?? 0}
                    </Text>
                    <Text style={tw`text-[10px] sm:text-[11px] text-emerald-600 font-black uppercase tracking-wider mt-1`}>
                      Pekerja AMT
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Pengawas */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('PengawasList')}
                  style={[
                    tw`p-4 sm:p-5 rounded-[28px] border border-white/60 justify-between mb-3`,
                    Platform.OS === 'web' && isLargeScreen ? { width: '100%' } : tw`w-[48%]`,
                    { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#003366', shadowOpacity: 0.08, shadowRadius: 16 },
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={tw`w-11 h-11 bg-amber-100 rounded-full items-center justify-center mb-3`}>
                    <Feather name="shield" size={20} color="#003366" />
                  </View>
                  <View>
                    <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                      {summaryData?.users?.pengawas ?? 0}
                    </Text>
                    <Text style={tw`text-[10px] sm:text-[11px] text-[#003366] font-black uppercase tracking-wider mt-1`}>
                      Pengawas
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Admin */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminList')}
                  style={[
                    tw`p-4 sm:p-5 rounded-[28px] border border-white/60 justify-between mb-3`,
                    Platform.OS === 'web' && isLargeScreen ? { width: '100%' } : tw`w-[48%]`,
                    { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.08, shadowRadius: 16 },
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={tw`w-11 h-11 bg-blue-100 rounded-full items-center justify-center mb-3`}>
                    <Feather name="user-check" size={20} color="#0055A5" />
                  </View>
                  <View>
                    <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>
                      {summaryData?.users?.admin ?? 0}
                    </Text>
                    <Text style={tw`text-[10px] sm:text-[11px] text-[#0055A5] font-black uppercase tracking-wider mt-1`}>
                      Admin
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Super Admin */}
                <TouchableOpacity
                  onPress={() => {
                    if (usersList.length === 0) fetchUsers(1);
                    setManageUsersModalVisible(true);
                  }}
                  style={[
                    tw`p-4 sm:p-5 rounded-[28px] border border-white/60 justify-between mb-3`,
                    Platform.OS === 'web' && isLargeScreen ? { width: '100%' } : tw`w-[48%]`,
                    { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.08, shadowRadius: 16 },
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={tw`w-11 h-11 bg-red-100 rounded-full items-center justify-center mb-3`}>
                    <Ionicons name="shield-checkmark" size={20} color="#ED1C24" />
                  </View>
                  <View>
                    <Text style={tw`text-3xl font-black text-[#ED1C24] tracking-tighter`}>
                      {summaryData?.users?.superAdmin ?? 0}
                    </Text>
                    <Text style={tw`text-[10px] sm:text-[11px] text-red-500 font-black uppercase tracking-wider mt-1`}>
                      Super Admin
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* ACTION CARDS STACK */}
            {/* 1. Daftar Pekerja */}
            <TouchableOpacity
              style={[
                tw`w-full p-4 sm:p-5 rounded-[28px] border border-white/60 mb-4 flex-row items-center justify-between`,
                { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.1, shadowRadius: 20 },
                Platform.OS === 'web' ? { cursor: 'pointer' } : {}
              ]}
              onPress={() => navigation.navigate('WorkerList')}
              activeOpacity={0.8}
            >
              <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                <View style={tw`w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3.5 shrink-0`}>
                  <Feather name="users" size={22} color="#00A651" />
                </View>
                <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                  <Text style={tw`text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                    Daftar Pekerja
                  </Text>
                  <Text style={tw`text-[10px] sm:text-[11px] text-green-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                    Manajemen Akun
                  </Text>
                </View>
              </View>
              <View style={tw`w-9 h-9 bg-green-50 rounded-full items-center justify-center shrink-0`}>
                <Feather name="chevron-right" size={20} color="#00A651" />
              </View>
            </TouchableOpacity>

            {/* 2. Daftar Pengawas (Khusus Super Admin) */}
            <TouchableOpacity
              style={[
                tw`w-full p-4 sm:p-5 rounded-[28px] border border-white/60 mb-4 flex-row items-center justify-between`,
                { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#003366', shadowOpacity: 0.1, shadowRadius: 20 },
                Platform.OS === 'web' ? { cursor: 'pointer' } : {}
              ]}
              onPress={() => navigation.navigate('PengawasList')}
              activeOpacity={0.8}
            >
              <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                <View style={tw`w-12 h-12 bg-amber-100 rounded-full items-center justify-center mr-3.5 shrink-0`}>
                  <Feather name="shield" size={22} color="#003366" />
                </View>
                <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                  <Text style={tw`text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                    Daftar Pengawas
                  </Text>
                  <Text style={tw`text-[10px] sm:text-[11px] text-[#003366] font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                    Manajemen Pengawas
                  </Text>
                </View>
              </View>
              <View style={tw`w-9 h-9 bg-blue-50 rounded-full items-center justify-center shrink-0`}>
                <Feather name="chevron-right" size={20} color="#003366" />
              </View>
            </TouchableOpacity>

            {/* 3. Daftar Admin (Khusus Super Admin) */}
            <TouchableOpacity
              style={[
                tw`w-full p-4 sm:p-5 rounded-[28px] border border-white/60 mb-4 flex-row items-center justify-between`,
                { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.1, shadowRadius: 20 },
                Platform.OS === 'web' ? { cursor: 'pointer' } : {}
              ]}
              onPress={() => navigation.navigate('AdminList')}
              activeOpacity={0.8}
            >
              <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3.5 shrink-0`}>
                  <Feather name="user-check" size={22} color="#0055A5" />
                </View>
                <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                  <Text style={tw`text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                    Daftar Admin
                  </Text>
                  <Text style={tw`text-[10px] sm:text-[11px] text-[#0055A5] font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                    Manajemen Admin
                  </Text>
                </View>
              </View>
              <View style={tw`w-9 h-9 bg-blue-50 rounded-full items-center justify-center shrink-0`}>
                <Feather name="chevron-right" size={20} color="#0055A5" />
              </View>
            </TouchableOpacity>

            {/* 4. Audit Log Sistem */}
            <TouchableOpacity
              style={[
                tw`w-full p-4 sm:p-5 rounded-[28px] border border-white/60 mb-4 flex-row items-center justify-between`,
                { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.1, shadowRadius: 20 },
                Platform.OS === 'web' ? { cursor: 'pointer' } : {}
              ]}
              onPress={() => navigation.navigate('AuditLog')}
              activeOpacity={0.8}
            >
              <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3.5 shrink-0`}>
                  <Feather name="clipboard" size={24} color="#0055A5" />
                </View>
                <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                  <Text style={tw`text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                    Audit Log Sistem
                  </Text>
                  <Text style={tw`text-[10px] sm:text-[11px] text-blue-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                    Riwayat & Monitoring Keamanan
                  </Text>
                </View>
              </View>
              <View style={tw`w-9 h-9 bg-blue-50 rounded-full items-center justify-center shrink-0`}>
                <Feather name="chevron-right" size={20} color="#0055A5" />
              </View>
            </TouchableOpacity>

            {/* 5. Manajer Checklist */}
            <TouchableOpacity
              style={[
                tw`w-full p-4 sm:p-5 rounded-[28px] border border-white/60 mb-4 flex-row items-center justify-between`,
                { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.1, shadowRadius: 20 },
                Platform.OS === 'web' ? { cursor: 'pointer' } : {}
              ]}
              onPress={() => navigation.navigate('ChecklistManager')}
              activeOpacity={0.8}
            >
              <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                <View style={tw`w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3.5 shrink-0`}>
                  <Feather name="check-square" size={24} color="#00A651" />
                </View>
                <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                  <Text style={tw`text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                    Manajer Checklist
                  </Text>
                  <Text style={tw`text-[10px] sm:text-[11px] text-green-600 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                    Konfigurasi Pertanyaan Inspeksi
                  </Text>
                </View>
              </View>
              <View style={tw`w-9 h-9 bg-green-50 rounded-full items-center justify-center shrink-0`}>
                <Feather name="chevron-right" size={20} color="#00A651" />
              </View>
            </TouchableOpacity>

            {/* 6. Kelola Role Pengguna (Fitur Eksekutif Super Admin) */}
            <TouchableOpacity
              style={[
                tw`w-full p-4 sm:p-5 rounded-[28px] border border-white/60 mb-10 flex-row items-center justify-between`,
                { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.08, shadowRadius: 20 },
                Platform.OS === 'web' ? { cursor: 'pointer' } : {}
              ]}
              onPress={() => {
                if (usersList.length === 0) fetchUsers(1);
                setManageUsersModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={tw`flex-row items-center flex-1 min-w-0 mr-3`}>
                <View style={tw`w-12 h-12 bg-red-100 rounded-full items-center justify-center mr-3.5 shrink-0`}>
                  <Feather name="sliders" size={22} color="#ED1C24" />
                </View>
                <View style={tw`flex-1 min-w-0 justify-center py-0.5`}>
                  <Text style={tw`text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight`} numberOfLines={1}>
                    Kelola Role Pengguna
                  </Text>
                  <Text style={tw`text-[10px] sm:text-[11px] text-red-500 font-black uppercase tracking-wider mt-1 leading-normal`} numberOfLines={1}>
                    Kontrol Hak Akses Tingkat Tinggi
                  </Text>
                </View>
              </View>
              <View style={tw`w-9 h-9 bg-red-50 rounded-full items-center justify-center shrink-0`}>
                <Feather name="chevron-right" size={20} color="#ED1C24" />
              </View>
            </TouchableOpacity>

            {/* ACTION CARDS (SCAN QR - Identik dengan AdminDashboardScreen) */}
            <View style={tw`flex-row justify-between mb-10`}>
              <TouchableOpacity
                style={[tw`flex-1 mr-3`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                onPress={() => navigation.navigate('Scanner', { type: 'mulai' })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={PERTAMINA_GREEN}
                  style={tw`p-5 rounded-[40px] shadow-xl shadow-green-900/20 relative overflow-hidden h-56 justify-between`}
                >
                  <View style={tw`absolute -right-12 -bottom-12 opacity-10`}>
                    <Ionicons name="qr-code" size={180} color="white" />
                  </View>
                  <View style={tw`w-14 h-14 bg-white/20 rounded-2xl items-center justify-center border border-white/30 shadow-sm`}>
                    <Feather name="log-in" size={24} color="white" />
                  </View>
                  <View style={tw`mt-6`}>
                    <Text style={tw`text-green-200 font-bold text-[10px] uppercase tracking-widest mb-1`}>SCAN QR</Text>
                    <Text style={tw`text-white font-bold text-2xl tracking-tight leading-7`}>Mulai{"\n"}Pekerjaan</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[tw`flex-1 ml-3`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                onPress={() => navigation.navigate('Scanner', { type: 'akhiri' })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#dc2626', '#7f1d1d']}
                  style={tw`p-5 rounded-[40px] shadow-xl shadow-red-900/20 relative overflow-hidden h-56 justify-between`}
                >
                  <View style={tw`absolute -right-12 -bottom-12 opacity-10`}>
                    <Ionicons name="qr-code" size={180} color="white" />
                  </View>
                  <View style={tw`w-14 h-14 bg-white/20 rounded-2xl items-center justify-center border border-white/30 shadow-sm`}>
                    <Feather name="log-out" size={24} color="white" />
                  </View>
                  <View style={tw`mt-6`}>
                    <Text style={tw`text-red-200 font-bold text-[10px] uppercase tracking-widest mb-1`}>SCAN QR</Text>
                    <Text style={tw`text-white font-bold text-2xl tracking-tight leading-7`}>Akhiri{"\n"}Pekerjaan</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ARSIP DATABASE BANNER */}
            <TouchableOpacity
              style={[tw`w-full mb-10`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
              onPress={() => navigation.navigate('History')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={PERTAMINA_BLUE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`p-8 rounded-[40px] shadow-2xl shadow-blue-500/40 relative overflow-hidden`}
              >
                <View style={tw`absolute -right-10 -top-10 opacity-20`}>
                  <Ionicons name="documents" size={200} color="white" />
                </View>
                <View style={tw`w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-8`}>
                  <Feather name="database" size={32} color="white" />
                </View>
                <Text style={tw`text-blue-200 font-bold text-sm uppercase tracking-widest mb-2`}>Arsip Database</Text>
                <Text style={tw`text-white font-black text-3xl tracking-tight`}>Lihat Seluruh Laporan</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* LIVE RECORD HANDOVER FEED */}
            <View>
              <View style={tw`flex-row justify-between items-center mb-6`}>
                <Text style={tw`text-2xl font-black text-gray-800 tracking-tight`}>Live Record Handover</Text>
                <View style={tw`bg-blue-100 px-4 py-1.5 rounded-full`}>
                  <Text style={tw`text-blue-600 text-xs font-black uppercase tracking-widest`}>Hari Ini</Text>
                </View>
              </View>

              {loadingAlerts ? (
                <ActivityIndicator size="large" color="#ED1C24" style={tw`my-10`} />
              ) : alerts.length > 0 ? (
                <View>
                  <View
                    style={[
                      tw`w-full`,
                      Platform.OS === 'web' && isLargeScreen
                        ? {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 16,
                            width: '100%'
                          }
                        : (isLargeScreen ? tw`flex-row flex-wrap justify-between` : tw`flex-col`)
                    ]}
                  >
                    {alerts.slice(0, displayedAlertsCount).map((item) => (
                      <View
                        key={item.id}
                        style={[
                          Platform.OS === 'web' && isLargeScreen
                            ? { width: '100%' }
                            : (isLargeScreen ? tw`w-[48.5%]` : tw`w-full`)
                        ]}
                      >
                        {renderAlertItem({ item })}
                      </View>
                    ))}
                  </View>
                  {alerts.length > displayedAlertsCount && (
                    <TouchableOpacity
                      style={[
                        tw`mt-4 bg-white/60 border border-gray-200 py-3 rounded-2xl items-center justify-center`,
                        Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                      ]}
                      onPress={() => setDisplayedAlertsCount((prev) => prev + 4)}
                    >
                      <Text style={tw`text-blue-600 font-bold text-sm tracking-wide`}>Tampilkan Lebih Banyak</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View
                  style={[
                    tw`items-center justify-center py-16 px-6 rounded-[35px] border border-white/60`,
                    { backgroundColor: 'rgba(255,255,255,0.6)', ...glassStyle }
                  ]}
                >
                  <View style={tw`w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6`}>
                    <Feather name="inbox" size={48} color="#9CA3AF" />
                  </View>
                  <Text style={tw`text-gray-800 font-black text-2xl tracking-tight`}>Belum Ada Laporan</Text>
                  <Text style={tw`text-gray-500 text-center text-sm mt-3 font-semibold px-4`}>
                    Belum ada pekerja yang mengirimkan form handover hari ini.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}
        <MobileBottomNav
          user={user}
          navigation={navigation}
          activeMenu="Home"
          unreadNotificationsCount={unreadNotificationsCount}
          handleLogout={handleLogout}
          isLogoutVisible={isLogoutVisible}
        />
      </SafeAreaView>

      {/* ============================================================ */}
      {/* MODAL MASTER: KELOLA PENGGUNA SISTEM                         */}
      {/* ============================================================ */}
      <Modal
        visible={manageUsersModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setManageUsersModalVisible(false)}
      >
        <SafeAreaView style={tw`flex-1 bg-[#F4F7FA]`}>
          {/* Header */}
          <View style={tw`px-5 py-4 bg-white border-b border-gray-200 flex-row items-center justify-between shadow-xs`}>
            <View style={tw`flex-row items-center`}>
              <TouchableOpacity
                onPress={() => setManageUsersModalVisible(false)}
                style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3`}
              >
                <Feather name="arrow-left" size={20} color="#1F2937" />
              </TouchableOpacity>
              <View>
                <Text style={tw`text-lg font-black text-gray-900`}>Kelola Pengguna Sistem</Text>
                <Text style={tw`text-xs text-gray-500 font-medium`}>Manajemen role dan status akun terdaftar</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => fetchUsers(userPage)}
              style={tw`w-10 h-10 rounded-full bg-blue-50 border border-blue-200 items-center justify-center`}
            >
              <Feather name="refresh-cw" size={18} color="#0055A5" />
            </TouchableOpacity>
          </View>

          <ScrollView style={tw`flex-1 p-5`} showsVerticalScrollIndicator={false}>
            {/* Search Input */}
            <View style={tw`flex-row items-center bg-white px-4 py-3 rounded-2xl border border-gray-200 mb-3 shadow-xs`}>
              <Feather name="search" size={18} color="#9CA3AF" style={tw`mr-2`} />
              <TextInput
                placeholder="Cari nama, username, atau NIP..."
                value={userSearch}
                onChangeText={(text) => setUserSearch(text)}
                onSubmitEditing={() => fetchUsers(1)}
                style={tw`flex-1 text-sm text-gray-800`}
                placeholderTextColor="#9CA3AF"
              />
              {userSearch ? (
                <TouchableOpacity onPress={() => setUserSearch('')}>
                  <Feather name="x" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Role Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-3`}>
              <View style={tw`flex-row gap-2`}>
                {[
                  { id: 'ALL', label: 'Semua Role' },
                  { id: 'AMT', label: 'AMT' },
                  { id: 'PENGAWAS', label: 'Pengawas' },
                  { id: 'ADMIN', label: 'Admin' },
                  { id: 'SUPER_ADMIN', label: 'Super Admin' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setUserRoleFilter(item.id)}
                    style={[
                      tw`px-3 py-1.5 rounded-full border`,
                      userRoleFilter === item.id
                        ? tw`bg-[#0055A5] border-[#0055A5]`
                        : tw`bg-white border-gray-200`
                    ]}
                  >
                    <Text style={[tw`text-xs font-bold`, userRoleFilter === item.id ? tw`text-white` : tw`text-gray-700`]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Status Filter Pills */}
            <View style={tw`flex-row gap-2 mb-4`}>
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'active', label: 'Aktif' },
                { id: 'inactive', label: 'Nonaktif' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setUserStatusFilter(item.id)}
                  style={[
                    tw`px-3 py-1 rounded-full border`,
                    userStatusFilter === item.id
                      ? tw`bg-gray-800 border-gray-800`
                      : tw`bg-white border-gray-200`
                  ]}
                >
                  <Text style={[tw`text-[11px] font-bold`, userStatusFilter === item.id ? tw`text-white` : tw`text-gray-700`]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* User Items List */}
            {usersLoading ? (
              <ActivityIndicator size="large" color="#0055A5" style={tw`my-12`} />
            ) : usersList.length > 0 ? (
              <View style={tw`gap-3 mb-6`}>
                {usersList.map((item) => {
                  const isUserActive = item.isActive !== false && item.status !== 'INACTIVE';
                  const isSelf = item.id === user?.id;
                  return (
                    <View
                      key={item.id}
                      style={[
                        tw`p-4 rounded-2xl bg-white border border-gray-200 shadow-xs`,
                        { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 }
                      ]}
                    >
                      <View style={tw`flex-row items-center justify-between mb-2`}>
                        <View style={tw`flex-row items-center flex-1 mr-2`}>
                          <View style={tw`w-10 h-10 rounded-full bg-blue-50 border border-blue-200 items-center justify-center mr-3`}>
                            <Text style={tw`text-xs font-black text-[#0055A5]`}>
                              {(item.name || 'U').substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={tw`flex-1`}>
                            <View style={tw`flex-row items-center gap-1.5`}>
                              <Text style={tw`text-sm font-black text-gray-900`} numberOfLines={1}>
                                {item.name}
                              </Text>
                              {isSelf && (
                                <View style={tw`px-1.5 py-0.5 rounded bg-blue-100`}>
                                  <Text style={tw`text-[9px] font-black text-[#0055A5]`}>SAYA</Text>
                                </View>
                              )}
                            </View>
                            <Text style={tw`text-xs text-gray-500 font-medium`}>@{item.username}</Text>
                          </View>
                        </View>
                        <View style={[
                          tw`px-2.5 py-1 rounded-full`,
                          isUserActive ? tw`bg-emerald-50 border border-emerald-200` : tw`bg-red-50 border border-red-200`
                        ]}>
                          <Text style={[tw`text-[10px] font-black`, isUserActive ? tw`text-emerald-700` : tw`text-red-700`]}>
                            {isUserActive ? 'Aktif' : 'Nonaktif'}
                          </Text>
                        </View>
                      </View>

                      {/* Role badge & Action Buttons */}
                      <View style={tw`flex-row items-center justify-between pt-2 border-t border-gray-100 mt-2`}>
                        <View style={tw`flex-row items-center`}>
                          <Text style={tw`text-[11px] text-gray-400 font-semibold mr-1.5`}>Role:</Text>
                          <View style={tw`px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100`}>
                            <Text style={tw`text-[11px] font-black text-[#0055A5]`}>{item.role}</Text>
                          </View>
                        </View>

                        {/* Actions */}
                        <View style={tw`flex-row items-center gap-2`}>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedUserForRole(item);
                              setNewSelectedRole(item.role);
                              setRoleModalVisible(true);
                            }}
                            style={tw`px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex-row items-center`}
                          >
                            <Feather name="shield" size={12} color="#0055A5" style={tw`mr-1`} />
                            <Text style={tw`text-[11px] font-bold text-[#0055A5]`}>Ubah Role</Text>
                          </TouchableOpacity>

                          {!isSelf && (
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedUserForStatus(item);
                                setStatusModalVisible(true);
                              }}
                              style={[
                                tw`px-3 py-1.5 rounded-xl border flex-row items-center`,
                                isUserActive ? tw`bg-red-50 border-red-200` : tw`bg-emerald-50 border-emerald-200`
                              ]}
                            >
                              <Feather
                                name={isUserActive ? 'user-x' : 'user-check'}
                                size={12}
                                color={isUserActive ? '#ED1C24' : '#00A651'}
                                style={tw`mr-1`}
                              />
                              <Text style={[tw`text-[11px] font-bold`, isUserActive ? tw`text-red-600` : tw`text-emerald-600`]}>
                                {isUserActive ? 'Nonaktifkan' : 'Aktifkan'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={tw`py-16 items-center justify-center bg-white rounded-3xl border border-gray-200`}>
                <Feather name="user-x" size={40} color="#9CA3AF" style={tw`mb-2`} />
                <Text style={tw`text-sm font-bold text-gray-700`}>Tidak ada pengguna ditemukan</Text>
                <Text style={tw`text-xs text-gray-400 mt-1`}>Coba ubah kata kunci pencarian atau filter Anda</Text>
              </View>
            )}

            {/* Pagination */}
            {userPagination.totalPages > 1 && (
              <View style={tw`flex-row items-center justify-between py-4 mb-8`}>
                <TouchableOpacity
                  disabled={userPage <= 1}
                  onPress={() => fetchUsers(userPage - 1)}
                  style={[
                    tw`px-4 py-2 rounded-xl border flex-row items-center`,
                    userPage <= 1 ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                  ]}
                >
                  <Feather name="chevron-left" size={16} color="#374151" />
                  <Text style={tw`text-xs font-bold text-gray-700 ml-1`}>Sebelumnya</Text>
                </TouchableOpacity>
                <Text style={tw`text-xs font-bold text-gray-500`}>
                  {userPage} / {userPagination.totalPages}
                </Text>
                <TouchableOpacity
                  disabled={userPage >= userPagination.totalPages}
                  onPress={() => fetchUsers(userPage + 1)}
                  style={[
                    tw`px-4 py-2 rounded-xl border flex-row items-center`,
                    userPage >= userPagination.totalPages ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                  ]}
                >
                  <Text style={tw`text-xs font-bold text-gray-700 mr-1`}>Berikutnya</Text>
                  <Feather name="chevron-right" size={16} color="#374151" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
