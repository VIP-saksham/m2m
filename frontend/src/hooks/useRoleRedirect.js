import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Post-login/registration landing route per user role.
const ROLE_HOME = {
  farmer: '/farmer/dashboard',
  processor: '/processor/dashboard',
  buyer: '/processor/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Returns a callback that navigates to the role's dashboard,
 * falling back to the landing page for unknown roles.
 */
export const useRoleRedirect = () => {
  const navigate = useNavigate();

  return useCallback(
    (role) => {
      navigate(ROLE_HOME[role] || '/');
    },
    [navigate]
  );
};
