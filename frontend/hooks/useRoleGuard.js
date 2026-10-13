import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getDashboardRoute, normalizeRole } from '../utils/authHelper';

export function useRoleGuard(allowedRoles) {
  const navigation = useNavigation();
  const allowedKey = Array.isArray(allowedRoles)
    ? allowedRoles.map(normalizeRole).join(',')
    : String(allowedRoles || '');

  useEffect(() => {
    let isMounted = true;

    const checkRole = async () => {
      try {
        if (!navigation) return;

        const userStr = await AsyncStorage.getItem('user');
        if (!userStr) {
          if (isMounted) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
          return;
        }

        if (isMounted) {
          let user;
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            user = null;
          }

          if (!user || !user.role) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
            return;
          }

          const effectiveRole = normalizeRole(user.role);
          const normalizedAllowed = (allowedRoles || []).map(normalizeRole);

          if (!normalizedAllowed.includes(effectiveRole)) {
            // Jika role tidak diizinkan, arahkan ke dashboard yang sesuai dengan role pengguna
            const targetDashboard = getDashboardRoute(effectiveRole);

            // Dapatkan nama route saat ini untuk mencegah redirect loop
            const state = navigation.getState ? navigation.getState() : null;
            const currentRoute = state?.routes?.[state?.index]?.name;

            if (currentRoute === targetDashboard) {
              return; // Sudah berada di target route, hentikan navigasi
            }

            if (targetDashboard === 'Login') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else if (typeof navigation.replace === 'function') {
              navigation.replace(targetDashboard);
            } else if (typeof navigation.navigate === 'function') {
              navigation.navigate(targetDashboard);
            }
          }
        }
      } catch (error) {
        console.log('Role guard check error:', error);
      }
    };

    let unsubscribe = () => {};
    if (navigation && typeof navigation.addListener === 'function') {
      unsubscribe = navigation.addListener('focus', () => {
        checkRole();
      });
    }

    checkRole(); // Cek saat pertama kali screen dimount

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, allowedKey]);
}

