import { Text, Box } from '@mantine/core';
import LanguageSelector from '../components/LanguageSelector'; // Import LanguageSelector
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AppFooter() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation(['footer', 'navigation']);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <Box 
      sx={(theme) => ({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
        marginTop: 'auto',
        borderTop: `1px solid ${theme.colors.gray[3]}`,
      })}
    >
      {!isAuthenticated && (
        <LanguageSelector />
      )}
      
      <Text size="sm" color="dimmed">
        {t('copyright', { year: currentYear, ns: 'footer' })}
        {isAuthenticated && (
              <>
              {' | '}
                <a href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  style={{ color: 'inherit', textDecoration: 'underline', margin: '0 8px', cursor: 'pointer' }}>
                    {t('logout', { ns: 'navigation' })}
                </a>
              </>
        )}
      </Text>
    </Box>
  );
}

export default AppFooter;