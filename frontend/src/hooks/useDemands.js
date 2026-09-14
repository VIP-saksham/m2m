import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export const useDemands = () => {
  return {
    data: null,
    isLoading: false,
    error: null
  };
};
