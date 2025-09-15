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
  Image,
  Group
} from "@mantine/core";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useAuth } from "../contexts/AuthContext";
import authService from "../api/authService";
import { useTranslation } from "react-i18next";


function Register() {
  const { t } = useTranslation("auth");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  const form = useForm({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      username: (value) =>
        !value
          ? t("usernameRequired") || "Username is required"
          : value.length < 3
          ? t("usernameTooShort") || "Username must be at least 3 characters"
          : !/^[a-zA-Z0-9_]+$/.test(value)
          ? t("usernameInvalid") || "Username can only contain letters, numbers, and underscores"
          : null,
      email: (value) =>
        !value
          ? t("emailRequired") || "Email is required"
          : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? t("emailInvalid") || "Invalid email format"
          : null,
      password: (value) =>
        !value
          ? t("passwordRequired") || "Password is required"
          : value.length < 8
          ? t("passwordTooShort") || "Password must be at least 8 characters"
          : null,
      confirmPassword: (value, values) =>
        value !== values.password ? t("passwordMismatch") || "Passwords do not match" : null,
    },
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError(""); // Clear previous errors
    try {
      const result = await register(
        values.username,
        values.email,
        values.password
      );

      if (result) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Register page: reg failed", error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with an error status code
        const responseData = error.response.data || {};
        
        // Check for specific error messages in the response
        if (responseData.detail) {
          // If there's a detail message from the backend, use it
          setError(responseData.detail);
          
          // Check for username or email conflicts in the error message
          if (responseData.detail.toLowerCase().includes('username')) {
            form.setFieldError('username', responseData.detail);
          } else if (responseData.detail.toLowerCase().includes('email')) {
            form.setFieldError('email', responseData.detail);
          }
        } else if (error.response.status === 422) {
          // Handle validation errors (like invalid email format)
          if (responseData.message?.includes('email')) {
            const errorMsg = t("emailInvalid", "Invalid email address");
            setError(errorMsg);
            form.setFieldError('email', errorMsg);
          } else if (responseData.message) {
            setError(responseData.message);
          } else {
            const errorMsg = t("registrationFailed", "Registration failed. Please check your details and try again.");
            setError(errorMsg);
          }
        } else if (error.response.status === 400) {
          // For 400 errors, try to get the first error message if available
          const errorMessage = responseData.detail || 
                              (responseData.message && typeof responseData.message === 'string' ? responseData.message : null) ||
                              t("badRequest", "Invalid request. Please check your details and try again.");
          setError(errorMessage);
          
          // Try to set field-level errors for common 400 errors
          if (responseData.detail) {
            if (responseData.detail.toLowerCase().includes('username')) {
              form.setFieldError('username', responseData.detail);
            } else if (responseData.detail.toLowerCase().includes('email')) {
              form.setFieldError('email', responseData.detail);
            } else if (responseData.detail.toLowerCase().includes('password')) {
              form.setFieldError('password', responseData.detail);
            }
          }
        } else if (error.response.status === 409) {
          // For 409 conflicts, check if it's email or username that already exists
          let conflictMessage = responseData.detail || 
                              (responseData.message?.includes('email') ? 
                                t("userExists", "An account with this email already exists.") :
                                t("usernameExists", "This username is already taken."));
          
          // If we couldn't determine the conflict type from the message, try to guess from the detail
          if (responseData.detail) {
            if (responseData.detail.toLowerCase().includes('email')) {
              conflictMessage = t("userExists", "An account with this email already exists.");
              form.setFieldError('email', conflictMessage);
            } else if (responseData.detail.toLowerCase().includes('username')) {
              conflictMessage = t("usernameExists", "This username is already taken.");
              form.setFieldError('username', conflictMessage);
            }
          }
          
          setError(conflictMessage);
        } else {
          // For other error status codes, use the error message if available, or a generic one
          const errorMessage = responseData.detail || 
                              (responseData.message && typeof responseData.message === 'string' ? responseData.message : null) ||
                              t("registrationError", "An error occurred during registration. Please try again later.");
          setError(errorMessage);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError(t("networkError", "Network error. Please check your connection and try again."));
      } else {
        // Something happened in setting up the request
        setError(t("requestError", "An error occurred. Please try again."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.redirectToGoogleOAuth();
  };

  // GitHub and Discord login handlers removed from UI but kept in code for future use

  return (
    <Container size={460} my={40}>
      <Group position="center" align="center" spacing="xs" mb={20}>
        <Stack spacing="xxs">
          <Title 
            order={1} 
            size={32} 
            weight={700} 
            align="center"
            className="font-friendly text-african_violet-500"
          >
            {t("createAccount", "Create Account")}
          </Title>
          <Text 
            color="dimmed" 
            size="lg" 
            align="center" 
            mb="xl"
            className="font-friendly text-davys_gray-600"
          >
            {t("joinToContinue", "Join ManaAI to start your learning journey")}
          </Text>
        </Stack>
      </Group>

      <Paper 
        withBorder 
        p={30} 
        radius="brutalist-xl"
        className="bg-snow-500 border-african_violet-200 shadow-brutalist-lg"
      >
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
            
            <TextInput
              label={t("email")}
              placeholder={t("emailPlaceholder", "Your email")}
              required
              size="lg"
              className="font-friendly"
              styles={{
                label: { color: 'var(--mantine-color-african_violet-6)', fontWeight: 500 },
                input: { borderColor: 'var(--mantine-color-african_violet-3)', '&:focus': { borderColor: 'var(--mantine-color-african_violet-5)' } }
              }}
              {...form.getInputProps("email")}
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
            
            <PasswordInput
              label={t("confirmPassword")}
              placeholder={t("confirmPasswordPlaceholder", "Confirm your password")}
              required
              size="lg"
              className="font-friendly"
              styles={{
                label: { color: 'var(--mantine-color-african_violet-6)', fontWeight: 500 },
                input: { borderColor: 'var(--mantine-color-african_violet-3)', '&:focus': { borderColor: 'var(--mantine-color-african_violet-5)' } }
              }}
              {...form.getInputProps("confirmPassword")}
            />

              <Button 
                fullWidth 
                type="submit" 
                size="lg" 
                loading={isLoading}
                className="bg-gradient-to-r from-african_violet-500 to-pumpkin-500 hover:from-african_violet-600 hover:to-pumpkin-600 text-white font-friendly h-12 rounded-brutalist transition-all duration-200 hover:transform hover:-translate-y-0.5 shadow-brutalist"
              >
                {t("signUp")}
              </Button>
            </Stack>
        </form>

        <Text align="center" mt="lg" className="font-friendly text-davys_gray-600">
          {t("haveAccount")}{" "}
          <Anchor 
            component={Link} 
            to="/auth/login" 
            weight={600}
            className="text-african_violet-600 hover:text-african_violet-700 no-underline hover:underline"
          >
            {t("signIn")}
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}

export default Register;
