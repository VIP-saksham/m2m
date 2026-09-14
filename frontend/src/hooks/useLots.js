import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export const useLots = () => {
  return {
    data: null,
    isLoading: false,
    error: null
  };
};
