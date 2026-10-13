import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  RefreshControl,
  Animated,
  Easing
} from 'react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import WebSidebar from '../../components/WebSidebar';
import WebNavbar from '../../components/WebNavbar';
import MobileBottomNav from '../../components/MobileBottomNav';
import NotificationSheet from '../../components/NotificationSheet';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { useSubpageBackHandler } from '../../hooks/useSubpageBackHandler';
import { handleLogoutAndReset } from '../../utils/authHelper';

const PERTAMINA_BLUE = ['#003366', '#0055A5'];
const PERTAMINA_GREEN = ['#00A651', '#007A3E'];

export default function AuditLogScreen({ navigation }) {
  // Baik ADMIN maupun SUPER_ADMIN berhak memantau Audit Log operasional sistem
  useRoleGuard(['SUPER_ADMIN', 'ADMIN']);

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [actionCategory, setActionCategory] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | 'TODAY' | '7D' | '30D' | 'CUSTOM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateValidationError, setDateValidationError] = useState('');

  // Pagination & Modals
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedLog, setSelectedLog] = useState(null);

  // Notifications & Logout
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Responsive layout
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);
  const isLargeScreen = screenWidth > 768;

  // Background floating animations
  const orbTranslateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbTranslateY, { toValue: -30, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orbTranslateY, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [orbTranslateY]);

  // Request race-condition guard
  const latestRequestRef = useRef(0);

  const fetchLogs = useCallback(async (targetPage = 1, overrides = {}) => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const currentSearch = overrides.search !== undefined ? overrides.search : appliedSearch;
      const currentCategory = overrides.actionType !== undefined ? overrides.actionType : actionCategory;
      const currentRole = overrides.role !== undefined ? overrides.role : roleFilter;
      const currentStart = overrides.startDate !== undefined ? overrides.startDate : startDate;
      const currentEnd = overrides.endDate !== undefined ? overrides.endDate : endDate;

      const params = {
        page: targetPage,
        limit: 15
      };

      if (currentSearch && currentSearch.trim() !== '') params.search = currentSearch.trim();
      if (currentCategory && currentCategory.trim() !== '') params.actionType = currentCategory.trim();
      if (currentRole && currentRole.trim() !== '') params.role = currentRole.trim();
      if (currentStart && currentStart.trim() !== '') params.startDate = currentStart.trim();
      if (currentEnd && currentEnd.trim() !== '') params.endDate = currentEnd.trim();

      const res = await axios.get(`${API_URL}/api/admins/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (requestId === latestRequestRef.current && res.data?.success) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1 });
        setPage(targetPage);
      }
    } catch (err) {
      if (requestId === latestRequestRef.current) {
        console.log('Error fetching audit logs:', err.response?.data?.error || err.message);
      }
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  }, [appliedSearch, actionCategory, roleFilter, startDate, endDate]);

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
    } catch (e) {}
  }, []);

  useEffect(() => {
    const init = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
      fetchLogs(1);
      fetchNotifications();
    };
    init();
  }, []); // Run on mount only

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLogs(page), fetchNotifications()]);
    setRefreshing(false);
  };

  // Helper date formatters
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

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Search Handlers
  const handleTriggerSearch = () => {
    const trimmed = searchQuery.trim();
    setAppliedSearch(trimmed);
    fetchLogs(1, { search: trimmed });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
    fetchLogs(1, { search: '' });
  };

  // Category Filter Handler
  const handleSelectCategory = (catKey) => {
    setActionCategory(catKey);
    fetchLogs(1, { actionType: catKey });
  };

  // Role Filter Handler
  const handleSelectRole = (roleKey) => {
    setRoleFilter(roleKey);
    fetchLogs(1, { role: roleKey });
  };

  // Date Preset Handler
  const handleSelectDatePreset = (preset) => {
    setDatePreset(preset);
    setDateValidationError('');

    const now = new Date();
    let newStart = '';
    let newEnd = '';

    if (preset === 'TODAY') {
      newStart = getLocalDateString(now);
      newEnd = getLocalDateString(now);
    } else if (preset === '7D') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      newStart = getLocalDateString(past);
      newEnd = getLocalDateString(now);
    } else if (preset === '30D') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      newStart = getLocalDateString(past);
      newEnd = getLocalDateString(now);
    } else if (preset === 'ALL') {
      newStart = '';
      newEnd = '';
    }

    setStartDate(newStart);
    setEndDate(newEnd);

    if (preset !== 'CUSTOM') {
      fetchLogs(1, { startDate: newStart, endDate: newEnd });
    }
  };

  const handleApplyCustomDate = () => {
    if (startDate && endDate && startDate > endDate) {
      setDateValidationError('Tanggal Mulai tidak boleh lebih besar daripada Tanggal Akhir');
      return;
    }
    setDateValidationError('');
    fetchLogs(1, { startDate, endDate });
  };

  const handleResetDate = () => {
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setDateValidationError('');
    fetchLogs(1, { startDate: '', endDate: '' });
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setActionCategory('');
    setRoleFilter('');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setDateValidationError('');
    fetchLogs(1, { search: '', actionType: '', role: '', startDate: '', endDate: '' });
  };

  const handleConfirmLogout = async () => {
    setIsLogoutVisible(false);
    await handleLogoutAndReset(navigation);
  };

  useSubpageBackHandler({
    navigation,
    user,
    modals: [
      { isOpen: !!selectedLog, close: () => setSelectedLog(null) },
      { isOpen: showNotificationsModal, close: () => setShowNotificationsModal(false) },
      { isOpen: isLogoutVisible, close: () => setIsLogoutVisible(false) },
    ],
    onBack: () => {
      if (user?.role === 'SUPER_ADMIN') {
        navigation.navigate('SuperAdminDashboard');
        return true;
      }
      return false;
    }
  });

  // Color badge mapping by Category
  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'USER_MANAGEMENT':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-[#0055A5]' };
      case 'FORCE_RELEASE':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' };
      case 'PASSWORD_RESET':
        return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' };
      case 'CHECKLIST':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' };
      case 'VEHICLE':
        return { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800' };
      case 'SECURITY':
        return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800' };
      case 'REPORT_EXPORT':
        return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-700' };
    }
  };

  // Color badge mapping by Role
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Super Admin' };
      case 'ADMIN':
        return { bg: 'bg-indigo-100', text: 'text-indigo-900', label: 'Admin' };
      case 'PENGAWAS':
        return { bg: 'bg-amber-100', text: 'text-amber-900', label: 'Pengawas' };
      case 'AMT':
        return { bg: 'bg-green-100', text: 'text-green-900', label: 'AMT' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: role || '-' };
    }
  };

  const hasActiveFilters = Boolean(
    appliedSearch || actionCategory || roleFilter || startDate || endDate || datePreset !== 'ALL'
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F4F7FA]`}>
      <View style={tw`flex-1 flex-row relative`}>
        {/* Background Ambient Gradient */}
        <Animated.View
          style={[
            tw`absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-15 pointer-events-none`,
            { transform: [{ translateY: orbTranslateY }] }
          ]}
        >
          <LinearGradient colors={['#0055A5', '#003366']} style={tw`w-full h-full rounded-full`} />
        </Animated.View>

        {/* 1. Sidebar (Desktop) */}
        {isLargeScreen && (
          <WebSidebar
            user={user}
            activeMenu="AuditLog"
            navigation={navigation}
            unreadNotificationsCount={unreadNotificationsCount}
            handleLogout={() => setIsLogoutVisible(true)}
          />
        )}

        {/* 2. Main Area */}
        <View style={tw`flex-1 flex-col overflow-hidden`}>
          <WebNavbar
            user={user}
            navigation={navigation}
            title="Audit Log Sistem"
            subtitle="Riwayat & Pemantauan Keamanan Sistem"
            showBack={true}
            onBack={() => {
              if (user?.role === 'SUPER_ADMIN') {
                navigation.navigate('SuperAdminDashboard');
              } else {
                navigation.navigate('AdminDashboard');
              }
            }}
            rightAction={
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
            }
          />

          <ScrollView
            style={tw`flex-1`}
            contentContainerStyle={tw`px-4 sm:px-6 py-4 ${isLargeScreen ? 'pb-20' : 'pb-36'}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0055A5']} />}
          >
            {/* Search & Filter Card */}
            <View style={tw`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm mb-4`}>
              {/* Row 1: Search Bar & Cari Button */}
              <View style={tw`flex-row flex-wrap items-center gap-2 mb-3.5`}>
                <View style={tw`flex-1 min-w-[260px] flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5`}>
                  <Feather name="search" size={18} color="#9CA3AF" style={tw`mr-2`} />
                  <TextInput
                    placeholder="Cari aksi, aktor, username, nopol, kategori, id..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={tw`flex-1 text-xs sm:text-sm text-gray-800`}
                    returnKeyType="search"
                    onSubmitEditing={handleTriggerSearch}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch} style={tw`p-1`}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleTriggerSearch}
                  style={[tw`bg-[#0055A5] px-5 py-2.5 rounded-xl shadow-sm flex-row items-center`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                  activeOpacity={0.8}
                >
                  <Feather name="search" size={14} color="white" style={tw`mr-1.5`} />
                  <Text style={tw`text-white font-bold text-xs sm:text-sm`}>Cari</Text>
                </TouchableOpacity>

                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={handleResetAllFilters}
                    style={[tw`bg-gray-100 hover:bg-gray-200 px-3.5 py-2.5 rounded-xl border border-gray-200 flex-row items-center`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                    activeOpacity={0.8}
                  >
                    <Feather name="rotate-ccw" size={13} color="#4B5563" style={tw`mr-1.5`} />
                    <Text style={tw`text-gray-700 font-bold text-xs`}>Reset Filter</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Row 2: Action Category Filter */}
              <View style={tw`pt-2.5 border-t border-gray-100 mb-2.5`}>
                <View style={tw`flex-row items-center mb-1.5`}>
                  <Feather name="tag" size={13} color="#6B7280" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-bold text-gray-700`}>Kategori Aksi:</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row py-0.5`}>
                  {[
                    { key: '', label: 'Semua Kategori' },
                    { key: 'USER_MANAGEMENT', label: 'User Management' },
                    { key: 'FORCE_RELEASE', label: 'Handover & Shift' },
                    { key: 'PASSWORD_RESET', label: 'Password Reset' },
                    { key: 'CHECKLIST', label: 'Master Checklist' },
                    { key: 'VEHICLE', label: 'Kendaraan' },
                    { key: 'SECURITY', label: 'Keamanan' },
                    { key: 'REPORT_EXPORT', label: 'Laporan & Export' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => handleSelectCategory(item.key)}
                      style={[
                        tw`px-3 py-1.5 rounded-xl mr-2 border`,
                        actionCategory === item.key
                          ? tw`bg-[#0055A5] border-[#0055A5]`
                          : tw`bg-gray-50 border-gray-200`
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-[11px] font-bold`,
                          actionCategory === item.key ? tw`text-white` : tw`text-gray-600`
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Row 3: Actor Role Filter */}
              <View style={tw`pt-2.5 border-t border-gray-100 mb-2.5`}>
                <View style={tw`flex-row items-center mb-1.5`}>
                  <Feather name="users" size={13} color="#6B7280" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-bold text-gray-700`}>Role Aktor:</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row py-0.5`}>
                  {[
                    { key: '', label: 'Semua Role' },
                    { key: 'SUPER_ADMIN', label: 'Super Admin' },
                    { key: 'ADMIN', label: 'Admin' },
                    { key: 'PENGAWAS', label: 'Pengawas' },
                    { key: 'AMT', label: 'AMT' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => handleSelectRole(item.key)}
                      style={[
                        tw`px-3 py-1.5 rounded-xl mr-2 border`,
                        roleFilter === item.key
                          ? tw`bg-[#003366] border-[#003366]`
                          : tw`bg-gray-50 border-gray-200`
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-[11px] font-bold`,
                          roleFilter === item.key ? tw`text-white` : tw`text-gray-600`
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Row 4: Date Range Filter */}
              <View style={tw`pt-2.5 border-t border-gray-100`}>
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <View style={tw`flex-row items-center`}>
                    <Feather name="calendar" size={13} color="#6B7280" style={tw`mr-1.5`} />
                    <Text style={tw`text-xs font-bold text-gray-700`}>Rentang Waktu:</Text>
                  </View>
                  {(startDate || endDate) && (
                    <TouchableOpacity onPress={handleResetDate}>
                      <Text style={tw`text-[11px] font-bold text-red-600`}>Hapus Tanggal</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Date Presets */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row mb-2.5 py-0.5`}>
                  {[
                    { key: 'ALL', label: 'Semua Waktu' },
                    { key: 'TODAY', label: 'Hari Ini' },
                    { key: '7D', label: '7 Hari Terakhir' },
                    { key: '30D', label: '30 Hari Terakhir' },
                    { key: 'CUSTOM', label: 'Kustom Tanggal' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => handleSelectDatePreset(item.key)}
                      style={[
                        tw`px-3 py-1 rounded-xl mr-2 border`,
                        datePreset === item.key
                          ? tw`bg-blue-50 border-[#0055A5]`
                          : tw`bg-gray-50 border-gray-200`
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-[11px] font-bold`,
                          datePreset === item.key ? tw`text-[#0055A5]` : tw`text-gray-600`
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Custom Date Inputs (Displayed when CUSTOM or when dates exist) */}
                {datePreset === 'CUSTOM' && (
                  <View style={tw`bg-gray-50 p-3 rounded-xl border border-gray-200`}>
                    <View style={tw`flex-row flex-wrap items-center gap-2 mb-2`}>
                      <View style={tw`flex-1 min-w-[140px]`}>
                        <Text style={tw`text-[10px] font-bold text-gray-500 uppercase mb-1`}>Tanggal Mulai</Text>
                        <TextInput
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#9CA3AF"
                          value={startDate}
                          onChangeText={setStartDate}
                          style={tw`bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-mono`}
                        />
                      </View>

                      <View style={tw`flex-1 min-w-[140px]`}>
                        <Text style={tw`text-[10px] font-bold text-gray-500 uppercase mb-1`}>Tanggal Akhir</Text>
                        <TextInput
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#9CA3AF"
                          value={endDate}
                          onChangeText={setEndDate}
                          style={tw`bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-mono`}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={handleApplyCustomDate}
                        style={[tw`bg-[#0055A5] px-4 py-2 rounded-lg self-end mt-2 sm:mt-0`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                      >
                        <Text style={tw`text-white font-bold text-xs`}>Terapkan</Text>
                      </TouchableOpacity>
                    </View>

                    {dateValidationError ? (
                      <Text style={tw`text-[11px] font-bold text-red-600 mt-1`}>{dateValidationError}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            </View>

            {/* List / Table Card */}
            <View style={tw`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <View style={tw`w-2 h-5 rounded-full bg-[#0055A5]`} />
                  <Text style={tw`text-base font-bold text-gray-900`}>
                    Catatan Aktivitas ({pagination.total} Entri)
                  </Text>
                </View>
                <Text style={tw`text-xs font-medium text-gray-500`}>
                  Halaman {page} dari {pagination.totalPages || 1}
                </Text>
              </View>

              {loading ? (
                <View style={tw`py-16 items-center justify-center`}>
                  <ActivityIndicator size="large" color="#0055A5" />
                  <Text style={tw`text-gray-500 text-xs font-semibold mt-3`}>Memuat catatan audit log...</Text>
                </View>
              ) : logs.length === 0 ? (
                <View style={tw`py-16 items-center justify-center`}>
                  <View style={tw`w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-3`}>
                    <Feather name="clipboard" size={28} color="#0055A5" />
                  </View>
                  <Text style={tw`text-gray-800 font-bold text-base`}>Tidak Ada Catatan Audit</Text>
                  <Text style={tw`text-gray-400 text-xs mt-1 text-center max-w-sm`}>
                    {hasActiveFilters
                      ? 'Tidak ada data yang cocok dengan kriteria filter atau pencarian Anda. Coba sesuaikan kata kunci atau rentang tanggal.'
                      : 'Belum ada catatan aktivitas sistem yang tercatat di database.'}
                  </Text>
                  {hasActiveFilters && (
                    <TouchableOpacity
                      onPress={handleResetAllFilters}
                      style={tw`mt-4 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200`}
                    >
                      <Text style={tw`text-[#0055A5] font-bold text-xs`}>Reset Seluruh Filter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={tw`divide-y divide-gray-100`}>
                  {logs.map((log) => {
                    const catStyle = getCategoryBadgeStyle(log.actionType);
                    const roleStyle = getRoleBadgeStyle(log.actor?.role);

                    return (
                      <TouchableOpacity
                        key={log.id}
                        onPress={() => setSelectedLog(log)}
                        style={[tw`py-3.5 flex-row items-start justify-between hover:bg-gray-50/70 rounded-xl px-2 -mx-2`, Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}]}
                        activeOpacity={0.7}
                      >
                        <View style={tw`flex-1 mr-3 min-w-0`}>
                          {/* Tags: Action, ActionType, NoPol */}
                          <View style={tw`flex-row items-center gap-1.5 flex-wrap mb-1.5`}>
                            <View style={tw`px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200`}>
                              <Text style={tw`text-[11px] font-black text-[#0055A5]`}>{log.action}</Text>
                            </View>

                            {log.actionType && (
                              <View style={[tw`px-2 py-0.5 rounded-md border`, tw`${catStyle.bg} ${catStyle.border}`]}>
                                <Text style={[tw`text-[10px] font-bold`, tw`${catStyle.text}`]}>{log.actionType}</Text>
                              </View>
                            )}

                            {log.noPolisi && (
                              <View style={tw`px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200`}>
                                <Text style={tw`text-[10px] font-bold text-amber-800`}>{log.noPolisi}</Text>
                              </View>
                            )}
                          </View>

                          {/* Actor Info */}
                          <View style={tw`flex-row items-center flex-wrap gap-1 mt-0.5`}>
                            <Text style={tw`text-xs text-gray-500 font-medium`}>Aktor:</Text>
                            <Text style={tw`text-xs font-bold text-gray-900`}>
                              {log.actor?.name || log.actor?.username || 'Sistem'}
                            </Text>
                            {log.actor?.username && (
                              <Text style={tw`text-[11px] text-gray-400 font-mono`}>
                                (@{log.actor.username})
                              </Text>
                            )}
                            <View style={[tw`px-1.5 py-0.5 rounded ml-1`, tw`${roleStyle.bg}`]}>
                              <Text style={[tw`text-[9px] font-bold uppercase tracking-wider`, tw`${roleStyle.text}`]}>
                                {roleStyle.label}
                              </Text>
                            </View>
                          </View>

                          {/* Details Snippet */}
                          {log.details && (
                            <Text style={tw`text-xs text-gray-500 mt-1.5 font-mono bg-gray-50/80 p-2 rounded-lg border border-gray-100`} numberOfLines={2}>
                              {log.details}
                            </Text>
                          )}
                        </View>

                        <View style={tw`items-end shrink-0`}>
                          <Text style={tw`text-[11px] text-gray-400 font-medium`}>
                            {formatDate(log.createdAt)}
                          </Text>
                          <View style={tw`w-7 h-7 rounded-full bg-gray-50 items-center justify-center mt-2 border border-gray-100`}>
                            <Feather name="chevron-right" size={14} color="#6B7280" />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <View style={tw`flex-row items-center justify-between pt-4 mt-2 border-t border-gray-100`}>
                  <TouchableOpacity
                    disabled={page <= 1}
                    onPress={() => fetchLogs(page - 1)}
                    style={[
                      tw`px-3.5 py-1.5 rounded-xl border flex-row items-center`,
                      page <= 1 ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`,
                      Platform.OS === 'web' && page > 1 ? { cursor: 'pointer' } : {}
                    ]}
                  >
                    <Feather name="chevron-left" size={14} color={page <= 1 ? '#9CA3AF' : '#374151'} style={tw`mr-1`} />
                    <Text style={tw`text-xs font-bold ${page <= 1 ? 'text-gray-400' : 'text-gray-700'}`}>Sebelumnya</Text>
                  </TouchableOpacity>

                  <View style={tw`items-center`}>
                    <Text style={tw`text-xs font-bold text-gray-800`}>
                      Halaman {page} dari {pagination.totalPages}
                    </Text>
                    <Text style={tw`text-[10px] text-gray-400 font-medium`}>
                      Total {pagination.total} catatan audit
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={page >= pagination.totalPages}
                    onPress={() => fetchLogs(page + 1)}
                    style={[
                      tw`px-3.5 py-1.5 rounded-xl border flex-row items-center`,
                      page >= pagination.totalPages ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`,
                      Platform.OS === 'web' && page < pagination.totalPages ? { cursor: 'pointer' } : {}
                    ]}
                  >
                    <Text style={tw`text-xs font-bold ${page >= pagination.totalPages ? 'text-gray-400' : 'text-gray-700'}`}>Berikutnya</Text>
                    <Feather name="chevron-right" size={14} color={page >= pagination.totalPages ? '#9CA3AF' : '#374151'} style={tw`ml-1`} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal Detail Audit Log */}
      <Modal visible={!!selectedLog} transparent animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center p-4`}>
          <View style={tw`bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl border border-gray-100`}>
            <View style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-9 h-9 rounded-xl bg-blue-50 items-center justify-center`}>
                  <Feather name="shield" size={18} color="#0055A5" />
                </View>
                <View>
                  <Text style={tw`font-bold text-base text-gray-900`}>Rincian Audit Log</Text>
                  <Text style={tw`text-[11px] text-gray-400`}>Detail transaksi dan payload audit</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedLog(null)} style={tw`p-1`}>
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <ScrollView style={tw`max-h-96`}>
                <View style={tw`gap-3`}>
                  {/* Action & Category */}
                  <View>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>AKSI & KATEGORI</Text>
                    <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                      <View style={tw`px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200`}>
                        <Text style={tw`text-xs font-black text-[#0055A5]`}>{selectedLog.action}</Text>
                      </View>
                      {selectedLog.actionType && (
                        <View style={tw`px-2 py-1 rounded-lg bg-gray-100 border border-gray-200`}>
                          <Text style={tw`text-xs font-semibold text-gray-700`}>{selectedLog.actionType}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actor Details */}
                  <View>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>AKTOR PELAKSANA</Text>
                    <View style={tw`bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex-row items-center justify-between`}>
                      <View>
                        <Text style={tw`text-xs font-bold text-gray-900`}>
                          {selectedLog.actor?.name || 'Sistem'}
                        </Text>
                        <Text style={tw`text-[11px] text-gray-500 font-mono`}>
                          Username: @{selectedLog.actor?.username || '-'}
                        </Text>
                      </View>
                      <View style={[tw`px-2 py-1 rounded-lg`, tw`${getRoleBadgeStyle(selectedLog.actor?.role).bg}`]}>
                        <Text style={[tw`text-[10px] font-black uppercase tracking-wider`, tw`${getRoleBadgeStyle(selectedLog.actor?.role).text}`]}>
                          {selectedLog.actor?.role || '-'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Timestamp */}
                  <View>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>WAKTU PENCATATAN</Text>
                    <Text style={tw`text-xs font-semibold text-gray-800`}>
                      {formatDate(selectedLog.createdAt)}
                    </Text>
                  </View>

                  {/* No Polisi & ActionId */}
                  {(selectedLog.noPolisi || selectedLog.actionId) && (
                    <View style={tw`flex-row gap-4`}>
                      {selectedLog.noPolisi ? (
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>NOMOR POLISI</Text>
                          <Text style={tw`text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 self-start`}>
                            {selectedLog.noPolisi}
                          </Text>
                        </View>
                      ) : null}

                      {selectedLog.actionId ? (
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>ID ENTITAS (ACTION ID)</Text>
                          <Text style={tw`text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 self-start`}>
                            {selectedLog.actionId}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {/* Details Payload */}
                  <View>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>DETAIL PAYLOAD</Text>
                    <View style={tw`bg-gray-900 p-3.5 rounded-xl mt-1 border border-gray-800`}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <Text style={tw`font-mono text-xs text-green-400 leading-relaxed`}>
                          {(() => {
                            if (!selectedLog.details) return 'Tidak ada payload detail tambahan';
                            try {
                              const parsed = JSON.parse(selectedLog.details);
                              return JSON.stringify(parsed, null, 2);
                            } catch {
                              return selectedLog.details;
                            }
                          })()}
                        </Text>
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={tw`mt-4 pt-3 border-t border-gray-100 items-end`}>
              <TouchableOpacity
                onPress={() => setSelectedLog(null)}
                style={tw`px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200`}
              >
                <Text style={tw`text-xs font-bold text-gray-700`}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal visible={isLogoutVisible} transparent animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center p-4`}>
          <View style={tw`bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-gray-100`}>
            <View style={tw`w-12 h-12 rounded-full bg-red-50 items-center justify-center mx-auto mb-3`}>
              <Feather name="log-out" size={22} color="#ED1C24" />
            </View>
            <Text style={tw`text-center font-bold text-base text-gray-900`}>Konfirmasi Keluar</Text>
            <Text style={tw`text-center text-xs text-gray-500 mt-1 mb-4`}>
              Apakah Anda yakin ingin keluar dari sesi ini?
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        user={user}
        navigation={navigation}
        activeMenu="AuditLog"
        unreadNotificationsCount={unreadNotificationsCount}
        handleLogout={() => setIsLogoutVisible(true)}
        isLogoutVisible={isLogoutVisible}
      />
    </SafeAreaView>
  );
}
