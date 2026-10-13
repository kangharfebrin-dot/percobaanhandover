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
import { handleLogoutAndReset, normalizeRole } from '../../utils/authHelper';

const PERTAMINA_BLUE = ['#003366', '#0055A5'];
const PERTAMINA_RED = ['#ED1C24', '#B30000'];
const PERTAMINA_GREEN = ['#00A651', '#007A3E'];
const GLASS_BG = 'rgba(255, 255, 255, 0.85)';
const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {};

export default function SuperAdminDashboardScreen({ navigation }) {
  // Hanya SUPER_ADMIN yang diizinkan mengakses Pusat Kendali ini
  useRoleGuard(['SUPER_ADMIN']);
  useDashboardBackHandler();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'audit'
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

  // Responsive Layout
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);
  const isLargeScreen = screenWidth > 768;

  // Background floating animations
  const orb1TranslateY = useRef(new Animated.Value(0)).current;
  const orb2TranslateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1TranslateY, { toValue: -40, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orb1TranslateY, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2TranslateY, { toValue: 50, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orb2TranslateY, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

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

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
      await Promise.all([
        fetchSummary(),
        fetchNotifications()
      ]);
    };
    init();
  }, [fetchSummary, fetchNotifications]);

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
      const newStatus = selectedUserForStatus.status === 'ACTIVE' ? false : true;
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

  // Logout Handler
  const handleConfirmLogout = async () => {
    setIsLogoutVisible(false);
    await handleLogoutAndReset(navigation);
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

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F4F7FA]`}>
      <View style={tw`flex-1 flex-row relative`}>
        {/* Background Ambient Gradients */}
        <Animated.View
          style={[
            tw`absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 pointer-events-none`,
            { transform: [{ translateY: orb1TranslateY }] }
          ]}
        >
          <LinearGradient colors={['#0055A5', '#003366']} style={tw`w-full h-full rounded-full`} />
        </Animated.View>
        <Animated.View
          style={[
            tw`absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-15 pointer-events-none`,
            { transform: [{ translateY: orb2TranslateY }] }
          ]}
        >
          <LinearGradient colors={['#ED1C24', '#B30000']} style={tw`w-full h-full rounded-full`} />
        </Animated.View>

        {/* 1. Web Sidebar (Desktop Only) */}
        {isLargeScreen && (
          <WebSidebar
            user={user}
            activeMenu="SuperAdminDashboard"
            navigation={navigation}
            unreadNotificationsCount={unreadNotificationsCount}
            handleLogout={() => setIsLogoutVisible(true)}
          />
        )}

        {/* 2. Main Content Area */}
        <View style={tw`flex-1 flex-col overflow-hidden`}>
          {/* Header / WebNavbar */}
          <WebNavbar
            user={user}
            navigation={navigation}
            title={isLargeScreen ? 'Pusat Kendali Sistem' : 'Pusat Kendali'}
            subtitle="Super Administrator Control Center"
            rightAction={
              <View style={tw`flex-row items-center gap-2`}>
                <TouchableOpacity
                  onPress={() => setShowNotificationsModal(true)}
                  style={[
                    tw`w-10 h-10 rounded-xl bg-white border border-gray-100 items-center justify-center relative shadow-sm`,
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={20} color="#0055A5" />
                  {unreadNotificationsCount > 0 && (
                    <View style={tw`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#ED1C24] border-2 border-white`} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsLogoutVisible(true)}
                  style={[
                    tw`w-10 h-10 rounded-xl bg-red-50 border border-red-100 items-center justify-center shadow-sm`,
                    Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                  ]}
                  activeOpacity={0.7}
                >
                  <Feather name="log-out" size={18} color="#991B1B" />
                </TouchableOpacity>
              </View>
            }
          />

          {/* Subheader Banner (Identitas Pertamina Patra Niaga & Super Admin) */}
          <View style={tw`px-4 sm:px-5 mt-1 mb-3`}>
            <LinearGradient
              colors={['#002B54', '#004380', '#0055A5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                tw`rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-blue-400/30`,
                { shadowColor: '#003366', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }
              ]}
            >
              <View style={tw`flex-row flex-wrap items-center justify-between gap-3 relative z-10`}>
                <View style={tw`flex-1 min-w-[240px]`}>
                  <View style={tw`flex-row items-center gap-2 mb-1.5`}>
                    <View style={tw`px-2.5 py-0.5 rounded-full bg-[#ED1C24] flex-row items-center`}>
                      <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" style={tw`mr-1`} />
                      <Text style={tw`text-[11px] font-black text-white tracking-wider`}>SUPER ADMIN</Text>
                    </View>
                    <View style={tw`px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-300/30`}>
                      <Text style={tw`text-[11px] font-semibold text-blue-100`}>PT Pertamina Patra Niaga</Text>
                    </View>
                  </View>
                  <Text style={tw`text-white text-xl sm:text-2xl font-black tracking-tight`}>
                    Pusat Kendali DIGI Handover
                  </Text>
                  <Text style={tw`text-blue-100 text-xs sm:text-sm mt-0.5`}>
                    Selamat bertugas, <Text style={tw`font-bold text-white`}>{user?.name || user?.username || 'Super Administrator'}</Text>. Seluruh wewenang sistem berada di bawah kendali Anda.
                  </Text>
                </View>

                {/* Status Server / Database Badge */}
                <View style={tw`flex-row items-center bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 self-start`}>
                  <View style={tw`w-2.5 h-2.5 rounded-full bg-[#00A651] mr-2`} />
                  <View>
                    <Text style={tw`text-white text-[11px] font-bold`}>Sistem Operasional Aktif</Text>
                    <Text style={tw`text-blue-200 text-[10px]`}>Prisma ORM & MySQL 5.22.0</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Navigation Tabs Header */}
          <View style={tw`px-4 sm:px-5 mb-3`}>
            <View style={tw`flex-row bg-white p-1 rounded-xl border border-gray-200 shadow-sm`}>
              <TouchableOpacity
                onPress={() => setActiveTab('overview')}
                style={[
                  tw`flex-1 py-2.5 rounded-lg flex-row items-center justify-center`,
                  activeTab === 'overview' ? tw`bg-[#0055A5] shadow-sm` : {}
                ]}
                activeOpacity={0.8}
              >
                <Feather name="activity" size={16} color={activeTab === 'overview' ? '#FFFFFF' : '#4B5563'} style={tw`mr-1.5`} />
                <Text style={[tw`text-xs sm:text-sm font-bold`, activeTab === 'overview' ? tw`text-white` : tw`text-gray-600`]}>
                  Ringkasan Sistem
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('users')}
                style={[
                  tw`flex-1 py-2.5 rounded-lg flex-row items-center justify-center`,
                  activeTab === 'users' ? tw`bg-[#0055A5] shadow-sm` : {}
                ]}
                activeOpacity={0.8}
              >
                <Feather name="users" size={16} color={activeTab === 'users' ? '#FFFFFF' : '#4B5563'} style={tw`mr-1.5`} />
                <Text style={[tw`text-xs sm:text-sm font-bold`, activeTab === 'users' ? tw`text-white` : tw`text-gray-600`]}>
                  Manajemen Pengguna
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('audit')}
                style={[
                  tw`flex-1 py-2.5 rounded-lg flex-row items-center justify-center`,
                  activeTab === 'audit' ? tw`bg-[#0055A5] shadow-sm` : {}
                ]}
                activeOpacity={0.8}
              >
                <Feather name="shield" size={16} color={activeTab === 'audit' ? '#FFFFFF' : '#4B5563'} style={tw`mr-1.5`} />
                <Text style={[tw`text-xs sm:text-sm font-bold`, activeTab === 'audit' ? tw`text-white` : tw`text-gray-600`]}>
                  Audit Log Aktivitas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Tab Views */}
          <ScrollView
            style={tw`flex-1`}
            contentContainerStyle={tw`px-4 sm:px-5 pb-16`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0055A5']} />}
          >
            {/* ============================================================ */}
            {/* TAB 1: RINGKASAN SISTEM (OVERVIEW)                           */}
            {/* ============================================================ */}
            {activeTab === 'overview' && (
              <View style={tw`flex-col gap-4`}>
                {loadingSummary && !summaryData ? (
                  <View style={tw`py-12 items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm`}>
                    <ActivityIndicator size="large" color="#0055A5" />
                    <Text style={tw`text-gray-500 text-sm mt-3`}>Memuat ringkasan sistem terpusat...</Text>
                  </View>
                ) : (
                  <>
                    {/* 1. Baris Statistik Akun & Role */}
                    <View style={tw`flex-row flex-wrap -mx-1.5`}>
                      {/* Total Pengguna */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-blue-50 items-center justify-center`}>
                              <Feather name="users" size={18} color="#0055A5" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-gray-400`}>SEMUA</Text>
                          </View>
                          <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.users?.total ?? 0}</Text>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>Total Pengguna Aktif</Text>
                        </View>
                      </View>

                      {/* Akun AMT */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center`}>
                              <Feather name="user-check" size={18} color="#00A651" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-emerald-600`}>AMT</Text>
                          </View>
                          <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.users?.amt ?? 0}</Text>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>Awak Mobil Tangki</Text>
                        </View>
                      </View>

                      {/* Akun Pengawas */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-purple-50 items-center justify-center`}>
                              <Feather name="eye" size={18} color="#7C3AED" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-purple-600`}>PENGAWAS</Text>
                          </View>
                          <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.users?.pengawas ?? 0}</Text>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>Pengawas Distribusi</Text>
                        </View>
                      </View>

                      {/* Akun Admin & Super Admin */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-amber-50 items-center justify-center`}>
                              <Feather name="shield" size={18} color="#D97706" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-amber-600`}>ADMIN</Text>
                          </View>
                          <View style={tw`flex-row items-baseline gap-1`}>
                            <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.users?.admin ?? 0}</Text>
                            <Text style={tw`text-xs font-bold text-red-600`}>+ {summaryData?.users?.superAdmin ?? 0} Super</Text>
                          </View>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>Staf Administrator</Text>
                        </View>
                      </View>
                    </View>

                    {/* 2. Baris Statistik Operasional & Kepatuhan */}
                    <View style={tw`flex-row flex-wrap -mx-1.5`}>
                      {/* Total Kendaraan */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-blue-50 items-center justify-center`}>
                              <Feather name="truck" size={18} color="#0055A5" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-blue-600`}>KENDARAAN</Text>
                          </View>
                          <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.vehicles?.total ?? 0}</Text>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>
                            {summaryData?.vehicles?.active ?? 0} Unit Status Aktif
                          </Text>
                        </View>
                      </View>

                      {/* Handover Hari Ini */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center`}>
                              <Feather name="repeat" size={18} color="#00A651" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-emerald-600`}>HARI INI</Text>
                          </View>
                          <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.handovers?.today ?? 0}</Text>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>
                            Total {summaryData?.handovers?.total ?? 0} Handover
                          </Text>
                        </View>
                      </View>

                      {/* Isu Kendaraan Berjalan (Kategori A) */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-red-50 items-center justify-center`}>
                              <Feather name="alert-triangle" size={18} color="#ED1C24" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-red-600`}>ISU UNIT</Text>
                          </View>
                          <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.issues?.active ?? 0}</Text>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>Isu Berjalan / Perbaikan</Text>
                        </View>
                      </View>

                      {/* Temuan Kepatuhan AMT (Kategori B) */}
                      <View style={tw`w-1/2 sm:w-1/4 px-1.5 mb-3`}>
                        <View style={[tw`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm`]}>
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`w-9 h-9 rounded-xl bg-amber-50 items-center justify-center`}>
                              <Feather name="clipboard" size={18} color="#D97706" />
                            </View>
                            <Text style={tw`text-[11px] font-bold text-amber-600`}>HSSE AMT</Text>
                          </View>
                          <Text style={tw`text-2xl font-black text-gray-900`}>{summaryData?.amtCompliance?.open ?? 0}</Text>
                          <Text style={tw`text-xs font-semibold text-gray-500`}>Temuan Terbuka (Open)</Text>
                        </View>
                      </View>
                    </View>

                    {/* 3. Pusat Kendali Menu Cepat (Quick Access Grid) */}
                    <View style={tw`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm`}>
                      <View style={tw`flex-row items-center justify-between mb-4`}>
                        <View style={tw`flex-row items-center gap-2`}>
                          <View style={tw`w-2 h-5 rounded-full bg-[#0055A5]`} />
                          <Text style={tw`text-base sm:text-lg font-bold text-gray-900`}>Pusat Kendali Operasional</Text>
                        </View>
                        <Text style={tw`text-xs text-gray-400 font-medium`}>Akses langsung seluruh modul sistem</Text>
                      </View>

                      <View style={tw`flex-row flex-wrap -mx-1.5`}>
                        {/* Kelola Pengguna & Role */}
                        <TouchableOpacity
                          onPress={() => setActiveTab('users')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 hover:border-blue-300 transition-all`}>
                            <Feather name="user-check" size={20} color="#0055A5" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Kelola Akun & Role</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>CRUD, status & wewenang</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Kelola Staf Admin */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AdminList')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-gray-50 border border-gray-100`}>
                            <Feather name="shield" size={20} color="#0055A5" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Daftar Admin</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>Kelola staf admin sistem</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Kelola Pengawas */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate('PengawasList')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-gray-50 border border-gray-100`}>
                            <Feather name="eye" size={20} color="#7C3AED" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Daftar Pengawas</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>Monitoring & audit akun</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Kelola AMT */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate('WorkerList')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-gray-50 border border-gray-100`}>
                            <Feather name="users" size={20} color="#00A651" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Daftar Awak MT</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>Akun pekerja lapangan</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Daftar Kendaraan */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate('VehicleList')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-gray-50 border border-gray-100`}>
                            <Feather name="truck" size={20} color="#0055A5" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Daftar Kendaraan</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>Unit mobil tangki & barcode</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Manajer Checklist */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate('ChecklistManager')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-gray-50 border border-gray-100`}>
                            <Feather name="check-square" size={20} color="#D97706" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Manajer Checklist</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>Item periksa & severity</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Seluruh Riwayat Handover */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate('History')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-gray-50 border border-gray-100`}>
                            <Feather name="file-text" size={20} color="#991B1B" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Riwayat Handover</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>Semua laporan & ekspor</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Isu & Perbaikan */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate('IssueList')}
                          style={[tw`w-1/2 sm:w-1/3 md:w-1/4 px-1.5 mb-3`]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`p-3.5 rounded-xl bg-gray-50 border border-gray-100`}>
                            <Feather name="alert-triangle" size={20} color="#ED1C24" style={tw`mb-1.5`} />
                            <Text style={tw`text-sm font-bold text-gray-900`}>Isu & Verifikasi</Text>
                            <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>Kerusakan & verifikasi</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 4. Aktivitas Audit Terkini (Recent Activities) */}
                    <View style={tw`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm`}>
                      <View style={tw`flex-row items-center justify-between mb-3`}>
                        <View style={tw`flex-row items-center gap-2`}>
                          <View style={tw`w-2 h-5 rounded-full bg-[#ED1C24]`} />
                          <Text style={tw`text-base sm:text-lg font-bold text-gray-900`}>Aktivitas Audit Terkini</Text>
                        </View>
                        <TouchableOpacity onPress={() => setActiveTab('audit')}>
                          <Text style={tw`text-xs font-bold text-[#0055A5]`}>Lihat Semua Audit →</Text>
                        </TouchableOpacity>
                      </View>

                      {summaryData?.auditLogs?.recent && summaryData.auditLogs.recent.length > 0 ? (
                        <View style={tw`divide-y divide-gray-100`}>
                          {summaryData.auditLogs.recent.map((log) => (
                            <View key={log.id} style={tw`py-3 flex-row items-start justify-between`}>
                              <View style={tw`flex-1 mr-3`}>
                                <View style={tw`flex-row items-center gap-2 flex-wrap mb-1`}>
                                  <View style={tw`px-2 py-0.5 rounded bg-blue-50 border border-blue-100`}>
                                    <Text style={tw`text-[10px] font-bold text-blue-700`}>{log.action}</Text>
                                  </View>
                                  {log.actionType && (
                                    <View style={tw`px-1.5 py-0.5 rounded bg-gray-100`}>
                                      <Text style={tw`text-[10px] font-semibold text-gray-600`}>{log.actionType}</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={tw`text-xs text-gray-600 font-medium`}>
                                  Oleh: <Text style={tw`font-bold text-gray-900`}>{log.actor?.name || log.actor?.username || 'Sistem'}</Text> ({log.actor?.role || '-'})
                                </Text>
                                {log.details && (
                                  <Text style={tw`text-[11px] text-gray-500 mt-0.5`} numberOfLines={1}>
                                    {log.details}
                                  </Text>
                                )}
                              </View>
                              <Text style={tw`text-[10px] text-gray-400 font-medium whitespace-nowrap`}>
                                {formatDate(log.createdAt)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={tw`py-8 items-center justify-center`}>
                          <Feather name="inbox" size={32} color="#9CA3AF" />
                          <Text style={tw`text-gray-400 text-xs mt-2`}>Belum ada aktivitas audit yang tercatat.</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 2: MANAJEMEN PENGGUNA & ROLE                             */}
            {/* ============================================================ */}
            {activeTab === 'users' && (
              <View style={tw`flex-col gap-4`}>
                {/* Search & Filters Header */}
                <View style={tw`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm`}>
                  <View style={tw`flex-row flex-wrap items-center gap-2 mb-3`}>
                    {/* Search Bar */}
                    <View style={tw`flex-1 min-w-[200px] flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2`}>
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
                          <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Apply Filter Button */}
                    <TouchableOpacity
                      onPress={() => fetchUsers(1)}
                      style={[tw`bg-[#0055A5] px-4 py-2.5 rounded-xl shadow-sm`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                    >
                      <Text style={tw`text-white font-bold text-xs`}>Cari / Filter</Text>
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
                          tw`px-2.5 py-1 rounded-lg border text-xs`,
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
                          tw`px-2.5 py-1 rounded-lg border text-xs`,
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

                {/* Users List Table / Card Grid */}
                <View style={tw`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm`}>
                  <View style={tw`flex-row items-center justify-between mb-3`}>
                    <Text style={tw`text-sm font-bold text-gray-700`}>
                      Daftar Akun Pengguna ({userPagination.total} ditemukan)
                    </Text>
                    <Text style={tw`text-xs text-gray-400`}>
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
                      <Text style={tw`text-gray-500 font-bold text-sm mt-2`}>Tidak ada pengguna yang cocok</Text>
                      <Text style={tw`text-gray-400 text-xs mt-0.5`}>Coba sesuaikan kata kunci atau filter status.</Text>
                    </View>
                  ) : (
                    <View style={tw`divide-y divide-gray-100`}>
                      {usersList.map((item) => {
                        const isSelf = user?.id === item.id;
                        const isItemActive = item.status === 'ACTIVE';

                        return (
                          <View key={item.id} style={tw`py-3.5 flex-row flex-wrap items-center justify-between gap-3`}>
                            {/* User Info */}
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
                              {/* Ubah Role */}
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedUserForRole(item);
                                  setNewSelectedRole(item.role);
                                  setRoleModalVisible(true);
                                }}
                                style={[
                                  tw`px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex-row items-center`,
                                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                                ]}
                                activeOpacity={0.7}
                              >
                                <Feather name="shield" size={13} color="#0055A5" style={tw`mr-1`} />
                                <Text style={tw`text-xs font-bold text-[#0055A5]`}>Ubah Role</Text>
                              </TouchableOpacity>

                              {/* Nonaktifkan / Aktifkan */}
                              {!isSelf ? (
                                <TouchableOpacity
                                  onPress={() => {
                                    setSelectedUserForStatus(item);
                                    setStatusModalVisible(true);
                                  }}
                                  style={[
                                    tw`px-3 py-1.5 rounded-lg border flex-row items-center`,
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
                                <View style={tw`px-3 py-1.5 rounded-lg bg-gray-100`}>
                                  <Text style={tw`text-xs font-semibold text-gray-400`}>Akun Aktif</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Pagination Controls */}
                  {userPagination.totalPages > 1 && (
                    <View style={tw`flex-row items-center justify-between pt-4 mt-2 border-t border-gray-100`}>
                      <TouchableOpacity
                        disabled={userPage <= 1}
                        onPress={() => fetchUsers(userPage - 1)}
                        style={[
                          tw`px-3 py-1.5 rounded-lg border`,
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
                          tw`px-3 py-1.5 rounded-lg border`,
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
                <View style={tw`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm`}>
                  <View style={tw`flex-row flex-wrap items-center gap-2 mb-3`}>
                    <View style={tw`flex-1 min-w-[200px] flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2`}>
                      <Feather name="search" size={16} color="#9CA3AF" style={tw`mr-2`} />
                      <TextInput
                        placeholder="Cari aksi, detail, nomor polisi..."
                        value={auditSearch}
                        onChangeText={(txt) => setAuditSearch(txt)}
                        style={tw`flex-1 text-xs sm:text-sm text-gray-800`}
                        returnKeyType="search"
                        onSubmitEditing={() => fetchAuditLogs(1)}
                      />
                      {auditSearch.length > 0 && (
                        <TouchableOpacity onPress={() => { setAuditSearch(''); fetchAuditLogs(1); }}>
                          <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => fetchAuditLogs(1)}
                      style={[tw`bg-[#0055A5] px-4 py-2.5 rounded-xl shadow-sm`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                    >
                      <Text style={tw`text-white font-bold text-xs`}>Cari Audit</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action Type Filter Pills */}
                  <View style={tw`flex-row flex-wrap items-center gap-2 pt-2 border-t border-gray-100`}>
                    <Text style={tw`text-xs font-bold text-gray-400 mr-1`}>Kategori:</Text>
                    {[
                      { key: '', label: 'Semua' },
                      { key: 'USER_MANAGEMENT', label: 'User Management' },
                      { key: 'HANDOVER', label: 'Handover' },
                      { key: 'PASSWORD_RESET', label: 'Password Reset' },
                      { key: 'CHECKLIST', label: 'Checklist' }
                    ].map((f) => (
                      <TouchableOpacity
                        key={f.key}
                        onPress={() => { setAuditActionFilter(f.key); }}
                        style={[
                          tw`px-2.5 py-1 rounded-lg border text-xs`,
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
                <View style={tw`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm`}>
                  <View style={tw`flex-row items-center justify-between mb-3`}>
                    <Text style={tw`text-sm font-bold text-gray-700`}>
                      Riwayat Audit Sistem ({auditPagination.total} entri)
                    </Text>
                    <Text style={tw`text-xs text-gray-400`}>
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
                      <Text style={tw`text-gray-500 font-bold text-sm mt-2`}>Tidak ada catatan audit</Text>
                      <Text style={tw`text-gray-400 text-xs mt-0.5`}>Coba sesuaikan kata kunci pencarian.</Text>
                    </View>
                  ) : (
                    <View style={tw`divide-y divide-gray-100`}>
                      {auditLogs.map((log) => (
                        <TouchableOpacity
                          key={log.id}
                          onPress={() => setSelectedLogDetail(log)}
                          style={[tw`py-3 flex-row items-start justify-between`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                          activeOpacity={0.7}
                        >
                          <View style={tw`flex-1 mr-3`}>
                            <View style={tw`flex-row items-center gap-2 flex-wrap mb-1`}>
                              <View style={tw`px-2 py-0.5 rounded bg-blue-50 border border-blue-200`}>
                                <Text style={tw`text-[11px] font-black text-blue-800`}>{log.action}</Text>
                              </View>
                              {log.actionType && (
                                <View style={tw`px-1.5 py-0.5 rounded bg-gray-100`}>
                                  <Text style={tw`text-[10px] font-semibold text-gray-600`}>{log.actionType}</Text>
                                </View>
                              )}
                              {log.noPolisi && (
                                <View style={tw`px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200`}>
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

                  {/* Pagination Controls */}
                  {auditPagination.totalPages > 1 && (
                    <View style={tw`flex-row items-center justify-between pt-4 mt-2 border-t border-gray-100`}>
                      <TouchableOpacity
                        disabled={auditPage <= 1}
                        onPress={() => fetchAuditLogs(auditPage - 1)}
                        style={[
                          tw`px-3 py-1.5 rounded-lg border`,
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
                          tw`px-3 py-1.5 rounded-lg border`,
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
      </View>

      {/* ============================================================ */}
      {/* MODAL 1: UBAH ROLE PENGGUNA                                  */}
      {/* ============================================================ */}
      <Modal visible={roleModalVisible} transparent animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center p-4`}>
          <View style={tw`bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-gray-100`}>
            <View style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-8 h-8 rounded-lg bg-blue-50 items-center justify-center`}>
                  <Feather name="shield" size={18} color="#0055A5" />
                </View>
                <Text style={tw`font-bold text-base text-gray-900`}>Ubah Role Akun</Text>
              </View>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedUserForRole && (
              <View style={tw`mb-4`}>
                <Text style={tw`text-xs text-gray-500`}>Akun Pengguna:</Text>
                <Text style={tw`text-sm font-bold text-gray-900 mt-0.5`}>{selectedUserForRole.name}</Text>
                <Text style={tw`text-xs text-gray-500`}>@{selectedUserForRole.username} • Role saat ini: <Text style={tw`font-bold text-[#0055A5]`}>{selectedUserForRole.role}</Text></Text>
              </View>
            )}

            <Text style={tw`text-xs font-bold text-gray-700 mb-2`}>Pilih Role Baru:</Text>
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
                    tw`p-3 rounded-xl border flex-row items-center justify-between`,
                    newSelectedRole === item.role
                      ? tw`bg-blue-50 border-[#0055A5]`
                      : tw`bg-gray-50 border-gray-200`
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-sm`, newSelectedRole === item.role ? tw`text-[#0055A5]` : tw`text-gray-800`]}>
                      {item.label}
                    </Text>
                    <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>{item.desc}</Text>
                  </View>
                  {newSelectedRole === item.role && (
                    <Ionicons name="checkmark-circle" size={20} color="#0055A5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={tw`flex-row items-center justify-end gap-2`}>
              <TouchableOpacity
                onPress={() => setRoleModalVisible(false)}
                style={tw`px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50`}
              >
                <Text style={tw`text-xs font-bold text-gray-700`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={roleUpdating}
                onPress={handleUpdateRole}
                style={tw`px-5 py-2.5 rounded-xl bg-[#0055A5] flex-row items-center`}
              >
                {roleUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={tw`text-xs font-bold text-white`}>Simpan Role</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: KONFIRMASI STATUS TOGGLE                            */}
      {/* ============================================================ */}
      <Modal visible={statusModalVisible} transparent animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center p-4`}>
          <View style={tw`bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-gray-100`}>
            {selectedUserForStatus && (
              <>
                <View style={tw`w-12 h-12 rounded-full ${selectedUserForStatus.status === 'ACTIVE' ? 'bg-red-50' : 'bg-emerald-50'} items-center justify-center mx-auto mb-3`}>
                  <Feather
                    name={selectedUserForStatus.status === 'ACTIVE' ? 'user-x' : 'user-check'}
                    size={24}
                    color={selectedUserForStatus.status === 'ACTIVE' ? '#ED1C24' : '#00A651'}
                  />
                </View>
                <Text style={tw`text-center font-bold text-base text-gray-900`}>
                  {selectedUserForStatus.status === 'ACTIVE' ? 'Nonaktifkan Akun?' : 'Aktifkan Akun Kembali?'}
                </Text>
                <Text style={tw`text-center text-xs text-gray-500 mt-1 mb-4`}>
                  {selectedUserForStatus.status === 'ACTIVE'
                    ? `Akun ${selectedUserForStatus.name} (@${selectedUserForStatus.username}) tidak akan dapat login ke sistem.`
                    : `Akun ${selectedUserForStatus.name} (@${selectedUserForStatus.username}) akan dapat login kembali.`}
                </Text>

                <View style={tw`flex-row items-center gap-2`}>
                  <TouchableOpacity
                    onPress={() => setStatusModalVisible(false)}
                    style={tw`flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 items-center`}
                  >
                    <Text style={tw`text-xs font-bold text-gray-700`}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={statusUpdating}
                    onPress={handleToggleStatus}
                    style={[
                      tw`flex-1 py-2.5 rounded-xl items-center`,
                      selectedUserForStatus.status === 'ACTIVE' ? tw`bg-[#ED1C24]` : tw`bg-[#00A651]`
                    ]}
                  >
                    {statusUpdating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={tw`text-xs font-bold text-white`}>
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
      <Modal visible={!!selectedLogDetail} transparent animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center p-4`}>
          <View style={tw`bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl border border-gray-100`}>
            <View style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-8 h-8 rounded-lg bg-blue-50 items-center justify-center`}>
                  <Feather name="shield" size={18} color="#0055A5" />
                </View>
                <Text style={tw`font-bold text-base text-gray-900`}>Rincian Audit Log</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedLogDetail(null)}>
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedLogDetail && (
              <ScrollView style={tw`max-h-96`}>
                <View style={tw`gap-2.5`}>
                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>AKSI & TIPE</Text>
                    <Text style={tw`text-sm font-bold text-gray-900`}>
                      {selectedLogDetail.action} {selectedLogDetail.actionType ? `(${selectedLogDetail.actionType})` : ''}
                    </Text>
                  </View>

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>AKTOR</Text>
                    <Text style={tw`text-xs font-semibold text-gray-800`}>
                      {selectedLogDetail.actor?.name || '-'} (@{selectedLogDetail.actor?.username || '-'}) — Role: {selectedLogDetail.actor?.role || '-'}
                    </Text>
                  </View>

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>WAKTU PENCATATAN</Text>
                    <Text style={tw`text-xs font-semibold text-gray-800`}>
                      {formatDate(selectedLogDetail.createdAt)}
                    </Text>
                  </View>

                  {selectedLogDetail.noPolisi && (
                    <View>
                      <Text style={tw`text-[11px] font-bold text-gray-400`}>NOMOR POLISI TERKAIT</Text>
                      <Text style={tw`text-xs font-bold text-gray-800`}>{selectedLogDetail.noPolisi}</Text>
                    </View>
                  )}

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>PAYLOAD / DETAIL</Text>
                    <View style={tw`bg-gray-50 p-3 rounded-xl border border-gray-200 mt-1`}>
                      <Text style={tw`font-mono text-xs text-gray-800`}>
                        {selectedLogDetail.details || 'Tidak ada detail tambahan'}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={tw`mt-4 pt-3 border-t border-gray-100 items-end`}>
              <TouchableOpacity
                onPress={() => setSelectedLogDetail(null)}
                style={tw`px-4 py-2 rounded-xl bg-gray-100`}
              >
                <Text style={tw`text-xs font-bold text-gray-700`}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 4: KONFIRMASI LOGOUT                                   */}
      {/* ============================================================ */}
      <Modal visible={isLogoutVisible} transparent animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center p-4`}>
          <View style={tw`bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-gray-100`}>
            <View style={tw`w-12 h-12 rounded-full bg-red-50 items-center justify-center mx-auto mb-3`}>
              <Feather name="log-out" size={22} color="#ED1C24" />
            </View>
            <Text style={tw`text-center font-bold text-base text-gray-900`}>Konfirmasi Keluar</Text>
            <Text style={tw`text-center text-xs text-gray-500 mt-1 mb-4`}>
              Apakah Anda yakin ingin mengakhiri sesi kendali Super Administrator ini?
            </Text>

            <View style={tw`flex-row items-center gap-2`}>
              <TouchableOpacity
                onPress={() => setIsLogoutVisible(false)}
                style={tw`flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 items-center`}
              >
                <Text style={tw`text-xs font-bold text-gray-700`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmLogout}
                style={tw`flex-1 py-2.5 rounded-xl bg-[#ED1C24] items-center`}
              >
                <Text style={tw`text-xs font-bold text-white`}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Sheet */}
      <NotificationSheet
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        navigation={navigation}
        onRefreshNotifications={fetchNotifications}
      />
    </SafeAreaView>
  );
}
