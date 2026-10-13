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
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import WebSidebar from '../../components/WebSidebar';
import WebNavbar from '../../components/WebNavbar';
import NotificationSheet from '../../components/NotificationSheet';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { useSubpageBackHandler } from '../../hooks/useSubpageBackHandler';
import { handleLogoutAndReset } from '../../utils/authHelper';

const PERTAMINA_BLUE = ['#003366', '#0055A5'];

export default function AuditLogScreen({ navigation }) {
  // Baik ADMIN maupun SUPER_ADMIN berhak memantau Audit Log operasional sistem
  useRoleGuard(['SUPER_ADMIN', 'ADMIN']);
  useSubpageBackHandler('AdminDashboard');

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionCategory, setActionCategory] = useState('');
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
  }, []);

  const fetchLogs = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const params = {
        page: targetPage,
        limit: 15,
        search: searchQuery,
        actionType: actionCategory
      };

      const res = await axios.get(`${API_URL}/api/admins/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data?.success) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1 });
        setPage(targetPage);
      }
    } catch (err) {
      console.log('Error fetching audit logs:', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, actionCategory]);

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
  }, [fetchLogs, fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLogs(page), fetchNotifications()]);
    setRefreshing(false);
  };

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

  const handleConfirmLogout = async () => {
    setIsLogoutVisible(false);
    await handleLogoutAndReset(navigation);
  };

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
            contentContainerStyle={tw`px-4 sm:px-6 py-4 pb-20`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0055A5']} />}
          >
            {/* Search & Filter Controls */}
            <View style={tw`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm mb-4`}>
              <View style={tw`flex-row flex-wrap items-center gap-2 mb-3`}>
                <View style={tw`flex-1 min-w-[200px] flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5`}>
                  <Feather name="search" size={16} color="#9CA3AF" style={tw`mr-2`} />
                  <TextInput
                    placeholder="Cari aksi, detail, nomor polisi, username..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={tw`flex-1 text-xs sm:text-sm text-gray-800`}
                    returnKeyType="search"
                    onSubmitEditing={() => fetchLogs(1)}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); fetchLogs(1); }}>
                      <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => fetchLogs(1)}
                  style={[tw`bg-[#0055A5] px-4 py-2.5 rounded-xl shadow-sm`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
                >
                  <Text style={tw`text-white font-bold text-xs`}>Cari / Filter</Text>
                </TouchableOpacity>
              </View>

              {/* Category Pills */}
              <View style={tw`flex-row flex-wrap items-center gap-2 pt-2 border-t border-gray-100`}>
                <Text style={tw`text-xs font-bold text-gray-400 mr-1`}>Kategori:</Text>
                {[
                  { key: '', label: 'Semua' },
                  { key: 'USER_MANAGEMENT', label: 'User Management' },
                  { key: 'HANDOVER', label: 'Handover' },
                  { key: 'PASSWORD_RESET', label: 'Password Reset' },
                  { key: 'CHECKLIST', label: 'Checklist' },
                  { key: 'FORCE_RELEASE', label: 'Force Release' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setActionCategory(item.key)}
                    style={[
                      tw`px-2.5 py-1 rounded-lg border`,
                      actionCategory === item.key
                        ? tw`bg-blue-50 border-[#0055A5]`
                        : tw`bg-gray-50 border-gray-200`
                    ]}
                  >
                    <Text style={[tw`text-[11px] font-bold`, actionCategory === item.key ? tw`text-[#0055A5]` : tw`text-gray-600`]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                <Text style={tw`text-xs text-gray-400`}>
                  Halaman {page} dari {pagination.totalPages || 1}
                </Text>
              </View>

              {loading ? (
                <View style={tw`py-12 items-center justify-center`}>
                  <ActivityIndicator size="small" color="#0055A5" />
                  <Text style={tw`text-gray-400 text-xs mt-2`}>Memuat catatan audit log...</Text>
                </View>
              ) : logs.length === 0 ? (
                <View style={tw`py-12 items-center justify-center`}>
                  <Feather name="clipboard" size={32} color="#9CA3AF" />
                  <Text style={tw`text-gray-500 font-bold text-sm mt-2`}>Tidak ada catatan audit</Text>
                  <Text style={tw`text-gray-400 text-xs mt-0.5`}>Coba sesuaikan kata kunci atau filter kategori.</Text>
                </View>
              ) : (
                <View style={tw`divide-y divide-gray-100`}>
                  {logs.map((log) => (
                    <TouchableOpacity
                      key={log.id}
                      onPress={() => setSelectedLog(log)}
                      style={[tw`py-3.5 flex-row items-start justify-between`, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]}
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <View style={tw`flex-row items-center justify-between pt-4 mt-2 border-t border-gray-100`}>
                  <TouchableOpacity
                    disabled={page <= 1}
                    onPress={() => fetchLogs(page - 1)}
                    style={[
                      tw`px-3 py-1.5 rounded-lg border`,
                      page <= 1 ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                    ]}
                  >
                    <Text style={tw`text-xs font-bold text-gray-700`}>← Sebelumnya</Text>
                  </TouchableOpacity>

                  <Text style={tw`text-xs font-medium text-gray-500`}>
                    {page} / {pagination.totalPages}
                  </Text>

                  <TouchableOpacity
                    disabled={page >= pagination.totalPages}
                    onPress={() => fetchLogs(page + 1)}
                    style={[
                      tw`px-3 py-1.5 rounded-lg border`,
                      page >= pagination.totalPages ? tw`bg-gray-100 border-gray-200 opacity-50` : tw`bg-white border-gray-300`
                    ]}
                  >
                    <Text style={tw`text-xs font-bold text-gray-700`}>Berikutnya →</Text>
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
                <View style={tw`w-8 h-8 rounded-lg bg-blue-50 items-center justify-center`}>
                  <Feather name="shield" size={18} color="#0055A5" />
                </View>
                <Text style={tw`font-bold text-base text-gray-900`}>Rincian Audit Log</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedLog(null)}>
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <ScrollView style={tw`max-h-96`}>
                <View style={tw`gap-2.5`}>
                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>AKSI & KATEGORI</Text>
                    <Text style={tw`text-sm font-bold text-gray-900`}>
                      {selectedLog.action} {selectedLog.actionType ? `(${selectedLog.actionType})` : ''}
                    </Text>
                  </View>

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>AKTOR</Text>
                    <Text style={tw`text-xs font-semibold text-gray-800`}>
                      {selectedLog.actor?.name || '-'} (@{selectedLog.actor?.username || '-'}) — Role: {selectedLog.actor?.role || '-'}
                    </Text>
                  </View>

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>WAKTU PENCATATAN</Text>
                    <Text style={tw`text-xs font-semibold text-gray-800`}>
                      {formatDate(selectedLog.createdAt)}
                    </Text>
                  </View>

                  {selectedLog.noPolisi && (
                    <View>
                      <Text style={tw`text-[11px] font-bold text-gray-400`}>NOMOR POLISI TERKAIT</Text>
                      <Text style={tw`text-xs font-bold text-gray-800`}>{selectedLog.noPolisi}</Text>
                    </View>
                  )}

                  <View>
                    <Text style={tw`text-[11px] font-bold text-gray-400`}>DETAIL PAYLOAD</Text>
                    <View style={tw`bg-gray-50 p-3 rounded-xl border border-gray-200 mt-1`}>
                      <Text style={tw`font-mono text-xs text-gray-800`}>
                        {selectedLog.details || 'Tidak ada detail tambahan'}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={tw`mt-4 pt-3 border-t border-gray-100 items-end`}>
              <TouchableOpacity
                onPress={() => setSelectedLog(null)}
                style={tw`px-4 py-2 rounded-xl bg-gray-100`}
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
    </SafeAreaView>
  );
}
