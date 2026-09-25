import { useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFindingReportEmail = () => {
  const sendFindingReportWithEmail = useCallback(async (handoverId, items, noPolisi, photoUrl = null) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(
        `${API_URL}/api/notifications/send-finding-email`,
        {
          handoverId,
          items,
          photoUrl,
          noPolisi
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        return {
          success: true,
          message: 'Laporan berhasil dikirim ke admin (App + Email)'
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error sending finding report email:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Gagal mengirim notifikasi email'
      };
    }
  }, []);

  return { sendFindingReportWithEmail };
};
