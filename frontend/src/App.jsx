import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './contexts/AuthContext';
import { ToolbarProvider } from './contexts/ToolbarContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CourseProvider } from './contexts/CourseContext';

import './i18n/i18n';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import CreateCourse from './pages/CreateCourse';
import CourseView from './pages/CourseView';
import ChapterView from './pages/ChapterView';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './layouts/AppLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import StatisticsPage from './pages/StatisticsPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import MyCourses from './pages/MyCourses';
import NotFoundPage from './pages/NotFoundPage';
import AdminView from './pages/AdminView';
import AnkiGeneratorDashboard from "./pages/AnkiGenerator/AnkiGeneratorDashboard.jsx";
import AnkiProcessingStatus from "./pages/AnkiGenerator/AnkiProcessingStatus.jsx";

function App() {
  return (
      <MantineProvider withGlobalStyles withNormalizeCSS theme={{
        primaryColor: 'violet',
        colors: {
          violet: ['#ebe5ef', '#d7cade', '#c4b0ce', '#b096bd', '#9c7bac', '#7f5b92', '#60446d', '#402e49', '#201724', '#0f0812'],
          orange: ['#ffe5d5', '#ffcbab', '#ffb282', '#ff9858', '#ff7f2d', '#f15c00', '#b54500', '#782e00', '#3c1700', '#1e0b00'],
          green: ['#e5efe4', '#cbdfc9', '#b0cfae', '#96c093', '#7cb078', '#5c9558', '#457042', '#2e4b2c', '#172516', '#0b120b'],
          blue: ['#f6faff', '#edf5ff', '#e3f0ff', '#daebff', '#d0e6ff', '#74b5ff', '#1784ff', '#0057ba', '#002b5d', '#00152e'],
          gray: ['#dadbdb', '#b6b7b7', '#919393', '#6d6f6f', '#4a4b4b', '#3b3c3c', '#2c2d2d', '#1d1e1e', '#0f0f0f', '#000000'],
          cyan: ['#dbf0ff', '#b8e0ff', '#94d1ff', '#70c1ff', '#4cb1ff', '#0a95ff', '#0071c7', '#004b85', '#002642', '#001321'],
        },
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        headings: { fontFamily: 'Inter, system-ui, -apple-system, sans-serif' },
        radius: {
          xs: '0.5rem',
          sm: '0.75rem', 
          md: '1rem',
          lg: '1.25rem',
          xl: '1.5rem',
        },
        components: {
          Button: {
            styles: () => ({
              root: {
                fontWeight: 500,
                borderRadius: '1rem',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(156, 123, 172, 0.15)',
                },
              },
            }),
          },
          Paper: {
            styles: () => ({
              root: {
                borderRadius: '1rem',
                boxShadow: '0 4px 6px -1px rgba(156, 123, 172, 0.1), 0 2px 4px -1px rgba(156, 123, 172, 0.06)',
              },
            }),
          },
          Card: {
            styles: () => ({
              root: {
                borderRadius: '1.25rem',
                boxShadow: '0 4px 6px -1px rgba(156, 123, 172, 0.1), 0 2px 4px -1px rgba(156, 123, 172, 0.06)',
              },
            }),
          },
          TextInput: {
            styles: () => ({
              input: {
                borderRadius: '0.75rem',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              },
            }),
          },
          Textarea: {
            styles: () => ({
              input: {
                borderRadius: '0.75rem',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              },
            }),
          },
          Select: {
            styles: () => ({
              input: {
                borderRadius: '0.75rem',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              },
            }),
          },
        },
      }}>
        <LanguageProvider>
          <AuthProvider>
            {/*<NotificationProvider>*/}
              <ToolbarProvider>
                <CourseProvider>
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                      <Routes>
                    {/* Public routes with MainLayout */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Redirect root to dashboard */}
                      <Route path="/auth/login" element={<Login />} />
                      <Route path="/auth/signup" element={<Register />} />
                      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                    </Route>
                      {/* Protected routes now based at /dashboard */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={<AppLayout />}> {/* Base path for dashboard and other protected routes */}
                        <Route index element={<Dashboard />} /> {/* This will be /dashboard */}
                        <Route path="my-courses" element={<MyCourses />} />
                        <Route path="create-course" element={<CreateCourse />} /> {/* /dashboard/create-course */}
                        <Route path="courses/:courseId" element={<CourseView />} /> {/* /dashboard/courses/:courseId */}
                        <Route path="courses/:courseId/chapters/:chapterId" element={<ChapterView />} /> {/* /dashboard/courses/:courseId/chapters/:chapterId */}
                        <Route path="statistics" element={<StatisticsPage />} /> {/* /dashboard/statistics */}
                        <Route path="anki-generator" element={<AnkiGeneratorDashboard />} />
                        <Route path="anki-generator/processing/:taskId" element={<AnkiProcessingStatus />} />
                      </Route>
                    </Route>
                      {/* Admin-only routes - Using AppLayout for consistent interface */}
                    <Route element={<AdminProtectedRoute />}>
                      <Route path="/admin" element={<AppLayout />}>
                        <Route index element={<AdminView />} />
                        {/* Add other admin routes here */}
                      </Route>
                    </Route>

                    {/* Old redirects removed as new routing handles root and protected areas explicitly */}
                    <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route for 404 */}
                  </Routes>          
                  </BrowserRouter>
                  </CourseProvider>
                  <ToastContainer position="top-right" autoClose={3000} theme="light" />
              </ToolbarProvider>
            {/*</NotificationProvider>*/}
          </AuthProvider>
        </LanguageProvider>
      </MantineProvider>
  );
}

export default App;