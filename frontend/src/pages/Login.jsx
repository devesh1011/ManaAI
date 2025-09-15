import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Text,
  Anchor,
  Stack,
  Divider,
  Box,
  Space,
  Image,
  Group,
} from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useAuth } from "../contexts/AuthContext";
import authService from "../api/authService";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

function Login() {
  const { t } = useTranslation("auth");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  // Use the new logo
  const logoPath = "/own-logo.png";

  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) =>
        !value ? t("usernameRequired") || "Username is required" : null,
      password: (value) =>
        !value
          ? t("passwordRequired") || "Password is required"
          : value.length < 3
          ? t("passwordLength") || "Password must be at least 3 characters"
          : null,
    },
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError("");
    form.clearErrors();
    
    try {
      const user = await login(values.username, values.password);
      if (user) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login page: Login failed", error);
      
      let errorMessage = t("loginError", "Invalid username or password. Please try again.");
      
      if (error.response) {
        // Server responded with an error status code
        const responseData = error.response.data || {};
        
        if (responseData.detail) {
          // If there's a detail message from the backend, use it
          errorMessage = responseData.detail;
          
          // Check for username or password errors in the message
          const errorLower = errorMessage.toLowerCase();
          if (errorLower.includes('username') || errorLower.includes('benutzername') || errorLower.includes('user')) {
            form.setFieldError('username', errorMessage);
          } else if (errorLower.includes('password') || errorLower.includes('passwort')) {
            form.setFieldError('password', errorMessage);
          }
        } else if (error.response.status === 400) {
          // For 400 errors, try to get the first error message if available
          errorMessage = responseData.detail || 
                        (responseData.message && typeof responseData.message === 'string' ? responseData.message : 
                        t("loginError", "Invalid username or password. Please try again."));
          
          // Set a general field error if we can't determine the specific field
          if (!form.isValid()) {
            form.setFieldError('username', ' ');
            form.setFieldError('password', ' ');
          }
        } else if (error.response.status === 401) {
          // For 401 Unauthorized (invalid credentials)
          errorMessage = t("invalidCredentials", "Invalid username or password.");
          form.setFieldError('username', ' ');
          form.setFieldError('password', ' ');
        } else {
          // For other error status codes
          errorMessage = responseData.detail || 
                        (responseData.message && typeof responseData.message === 'string' ? responseData.message : 
                        t("loginFailed", "An error occurred during login. Please try again later."));
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = t("networkError", "Network error. Please check your connection and try again.");
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.redirectToGoogleOAuth();
  };

  // GitHub and Discord login handlers removed from UI but kept in code for future use

  return (
    <Container align="center" size={460} my={40}>
      <Group position="center" align="center" spacing="xs" mb={20}>
        <Image 
          src={logoPath} 
          width={80} 
          mb="md" 
          alt="Mana AI Logo" 
          className="rounded-brutalist-lg" 
        />
        <Stack spacing="xxs">
          <Title 
            order={1} 
            size={32} 
            weight={700} 
            align="center"
            className="font-friendly text-african_violet-500"
          >
            {t("welcomeBack")}
          </Title>
          <Text 
            color="dimmed" 
            size="lg" 
            align="center" 
            mb="xl"
            className="font-friendly text-davys_gray-600"
          >
            {t("signInToContinue")}
          </Text>
        </Stack>
      </Group>

      <Paper 
        withBorder 
        p={30} 
        radius="brutalist-xl"
        className="bg-snow-500 border-african_violet-200 shadow-brutalist-lg"
      >
        {error && (
          <Text 
            color="red" 
            size="sm" 
            mb="md" 
            className="bg-pumpkin-900 text-pumpkin-100 p-3 rounded-brutalist font-friendly"
          >
            {error}
          </Text>
        )}
        <Button
          leftIcon={<IconBrandGoogleFilled size={20} />}
          variant="outline"
          fullWidth
          size="lg"
          onClick={handleGoogleLogin}
          mb="xl"
          className="border-african_violet-300 text-african_violet-600 hover:bg-african_violet-50 font-friendly h-12 rounded-brutalist transition-all duration-200 hover:transform hover:-translate-y-0.5"
        >
          {t("continueWithGoogle")}
        </Button>

        <Divider
          label={
            <Text size="sm" color="dimmed" className="font-friendly bg-snow-500 px-2">
              {t("orContinueWithEmail")}
            </Text>
          }
          labelPosition="center"
          my="lg"
          className="border-african_violet-200"
        />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack spacing="md">
            <TextInput
              label={t("username")}
              placeholder={t("usernamePlaceholder")}
              required
              size="lg"
              className="font-friendly"
              styles={{
                label: { color: 'var(--mantine-color-african_violet-6)', fontWeight: 500 },
                input: { borderColor: 'var(--mantine-color-african_violet-3)', '&:focus': { borderColor: 'var(--mantine-color-african_violet-5)' } }
              }}
              {...form.getInputProps("username")}
            />

            <PasswordInput
              label={t("password")}
              placeholder={t("passwordPlaceholder")}
              required
              size="lg"
              className="font-friendly"
              styles={{
                label: { color: 'var(--mantine-color-african_violet-6)', fontWeight: 500 },
                input: { borderColor: 'var(--mantine-color-african_violet-3)', '&:focus': { borderColor: 'var(--mantine-color-african_violet-5)' } }
              }}
              {...form.getInputProps("password")}
            />

            <Button
              fullWidth
              type="submit"
              size="lg"
              loading={isLoading}
              className="bg-gradient-to-r from-african_violet-500 to-pumpkin-500 hover:from-african_violet-600 hover:to-pumpkin-600 text-white font-friendly h-12 rounded-brutalist transition-all duration-200 hover:transform hover:-translate-y-0.5 shadow-brutalist"
            >
              {t("signIn")}
            </Button>
          </Stack>
        </form>

        <Text align="center" mt="lg" className="font-friendly text-davys_gray-600">
          {t("noAccount")}{" "}
          <Anchor 
            component={Link} 
            to="/auth/signup" 
            weight={600}
            className="text-african_violet-600 hover:text-african_violet-700 no-underline hover:underline"
          >
            {t("signUp")}
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}

export default Login;
