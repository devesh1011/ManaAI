import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { courseService } from '../api/courseService';
import { useAuth } from './AuthContext';
import { COURSE_STATUS } from '../utils/courseConstants';

const CourseContext = createContext();

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const { user } = useAuth();

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectWebSocketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second, exponential backoff

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message) => {
    console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'auth_success':
        console.log('WebSocket authentication successful');
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        setConnectionStatus('error');
        if (wsRef.current) {
          wsRef.current.close(1008, message.message);
        }
        break;

      case 'chapter_created':
        // Update chapters list with new chapter
        setChapters(prevChapters => {
          const existingChapter = prevChapters.find(ch => ch.id === message.data.id);
          if (existingChapter) {
            // Update existing chapter
            return prevChapters.map(ch =>
              ch.id === message.data.id ? { ...ch, ...message.data } : ch
            );
          } else {
            // Add new chapter
            return [...prevChapters, message.data];
          }
        });
        break;

      case 'questions_ready':
        // Update chapter to indicate questions are ready (will trigger refetch in ChapterView)
        setChapters(prevChapters =>
          prevChapters.map(chapter =>
            chapter.id === message.chapter_id
              ? { ...chapter, quiz_questions: Array(message.data.questions_count).fill({}) }
              : chapter
          )
        );
        break;

      case 'chapter_updated':
        // Update chapter with new data
        setChapters(prevChapters =>
          prevChapters.map(chapter =>
            chapter.id === message.data.chapter_id
              ? { ...chapter, ...message.data }
              : chapter
          )
        );
        break;

      case 'course_completed':
        // Update course status
        setCourse(prevCourse =>
          prevCourse ? { ...prevCourse, status: 'finished' } : null
        );
        setLoading(false);
        break;

      case 'course_error':
        // Handle course creation errors
        setError(message.data.error || 'An error occurred during course creation');
        setLoading(false);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  const scheduleReconnect = useCallback((courseId) => {
    if (reconnectTimeoutRef.current) return;

    reconnectAttempts.current += 1;
    const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current - 1);

    console.log(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (connectWebSocketRef.current) {
        connectWebSocketRef.current(courseId);
      }
    }, delay);
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback((courseId) => {
    connectWebSocketRef.current = connectWebSocket;
    if (!courseId || wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `ws://localhost:8127/ws/${courseId}`;
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Send authentication message
        if (user && user.id) {
          ws.send(JSON.stringify({
            type: 'auth',
            user_id: user.id
          }));
        } else {
          console.error('No user available for WebSocket authentication');
          ws.close(1008, 'Authentication failed');
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Attempt reconnection if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect(courseId);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setConnectionStatus('error');
    }
  }, [handleWebSocketMessage, scheduleReconnect, user]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttempts.current = 0;
  }, []);

  // Fetch course data (initial load only)
  const fetchCourseData = useCallback(async (courseId) => {
    if (!courseId || courseId === currentCourseId) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentCourseId(courseId);

      // Clear existing course and chapters data immediately to prevent showing old course data
      setCourse(null);
      setChapters([]);

      // Connect to WebSocket for real-time updates
      connectWebSocket(courseId);

      // Initial data fetch
      const [courseData, chaptersData] = await Promise.all([
        courseService.getCourseById(courseId),
        courseService.getCourseChapters(courseId),
      ]);

      setCourse(courseData);
      setChapters(chaptersData || []);

      // If course is still being created, keep loading state
      if (courseData.status === 'creating') {
        setLoading(true);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch course data:', err);
      setLoading(false);
    }
  }, [currentCourseId, connectWebSocket]);

  // Update course data
  const updateCourse = useCallback((courseData) => {
    setCourse(courseData);
  }, []);

  // Update chapters data
  const updateChapters = useCallback((chaptersData) => {
    setChapters(chaptersData);
  }, []);

  // Clear course data
  const clearCourseData = useCallback(() => {
    disconnectWebSocket();
    setCourse(null);
    setChapters([]);
    setCurrentCourseId(null);
    setError(null);
    setLoading(false);
  }, [disconnectWebSocket]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  const value = {
    course,
    chapters,
    loading,
    error,
    isConnected,
    connectionStatus,
    fetchCourseData,
    updateCourse,
    updateChapters,
    clearCourseData,
    clearError,
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};