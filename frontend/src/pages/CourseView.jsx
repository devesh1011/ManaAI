import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCourse } from '../contexts/CourseContext';
import { COURSE_STATUS } from '../utils/courseConstants';

import {
  Container,
  Title,
  Text,
  Card,
  Group,
  SimpleGrid,
  Progress,
  Badge,
  Button,
  ThemeIcon,
  Loader,
  Alert,
  Box,
  Paper,
  Image,
  Grid,
  Divider,
  RingProgress,
  Overlay,
  Modal,
  ActionIcon,
  Stack,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
  IconArrowRight,
  IconBrain,
  IconTrophy,
  IconArrowBack,
  IconCheck,
  IconChevronRight,
  IconX,
  IconPlayerPlay,
} from '@tabler/icons-react';

function CourseView() {
  const { t } = useTranslation('courseView');
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { course, chapters, loading, error, clearError, fetchCourseData } = useCourse();

  // Fetch course data when courseId changes
  useEffect(() => {
    if (courseId) {
      fetchCourseData(courseId);
    }
  }, [courseId, fetchCourseData]);

  // NEW: State for first-time video popup
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [hasSeenVideo, setHasSeenVideo] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // NEW: Auto-refresh fallback for course completion
  const [courseCreationStartTime, setCourseCreationStartTime] = useState(null);
  const [showRefreshButton, setShowRefreshButton] = useState(false);

  // Track when course creation started
  useEffect(() => {
    if (course?.status === 'creating' && !courseCreationStartTime) {
      setCourseCreationStartTime(Date.now());
      setShowRefreshButton(false);
    } else if (course?.status === 'finished') {
      setCourseCreationStartTime(null);
      setShowRefreshButton(false);
    }
  }, [course?.status, courseCreationStartTime]);

  // Show refresh button after 2 minutes of creating status (fallback)
  useEffect(() => {
    if (courseCreationStartTime && course?.status === 'creating') {
      const timeElapsed = Date.now() - courseCreationStartTime;
      const twoMinutes = 2 * 60 * 1000;

      if (timeElapsed > twoMinutes && !showRefreshButton) {
        setShowRefreshButton(true);
      }
    }
  }, [courseCreationStartTime, course?.status, showRefreshButton]);

  const [creationProgressUI, setCreationProgressUI] = useState({
    statusText: t('creation.statusInitializing'),
    percentage: 0,
    chaptersCreated: 0,
    estimatedTotal: 0,
  });

    // NEW: Check localStorage on mount
  useEffect(() => {
    const hasSeenVideoFlag = localStorage.getItem('hasSeenFirstCourseVideo');
    if (hasSeenVideoFlag === 'true') {
      setHasSeenVideo(true);
    }
  }, []);

  // NEW: Monitor when course content becomes ready
  useEffect(() => {
    if (course && course.title && course.description && course.image_url &&
        course.title !== 'None' && course.description !== 'None') {
      setContentReady(true);
    }
  }, [course]);

  // NEW: Show video popup after content is ready (with 2 second delay)
  useEffect(() => {
    if (contentReady && !hasSeenVideo && course?.status === 'creating') {
      const timer = setTimeout(() => {
        setShowVideoPopup(true);
        // Mark as seen when popup is shown
        localStorage.setItem('hasSeenFirstCourseVideo', 'true');
        setHasSeenVideo(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [contentReady, hasSeenVideo, course?.status]);

  // Initialize creationProgressUI when course data is available
  useEffect(() => {
    if (course && course.status === 'creating') {
      const totalChapters = course.chapter_count || 0;
      const currentChaptersLength = chapters ? chapters.filter(chapter => chapter.id !== null).length : 0;
      const progressPercent = totalChapters > 0 ? Math.round((currentChaptersLength / totalChapters) * 100) : 0;

      setCreationProgressUI({
        statusText: t('creation.statusCreatingChapters', {
          chaptersCreated: currentChaptersLength,
          totalChapters: totalChapters || t('creation.unknownTotal')
        }),
        percentage: progressPercent,
        chaptersCreated: currentChaptersLength,
        estimatedTotal: totalChapters,
      });
    } else if (course && course.status === 'finished') {
      const totalChapters = course.chapter_count || 0;
      const currentChaptersLength = chapters ? chapters.filter(chapter => chapter.id !== null).length : 0;

      setCreationProgressUI({
        statusText: t('creation.statusComplete'),
        percentage: 100,
        chaptersCreated: currentChaptersLength,
        estimatedTotal: totalChapters,
      });
    }
  }, [course, chapters, t]);

  // NEW: Function to close video popup
  const closeVideoPopup = () => {
    setShowVideoPopup(false);
  };

  // Learning progress calculation
  const { learningPercentage, actualCompletedLearningChapters, totalCourseChaptersForLearning } = useMemo(() => {
    // CHANGED: This logic now uses the separate `chapters` state
    if (!course || !chapters) {
      return { learningPercentage: 0, actualCompletedLearningChapters: 0, totalCourseChaptersForLearning: 0 };
    }
    const completedCount = chapters.filter(ch => ch.is_completed).length;
    // For finished courses, use actual chapter count; for creating courses, use planned count
    const totalCount = course.status === 'finished' ? chapters.length : (course.chapter_count || chapters.length || 0);
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return {
      learningPercentage: percentage,
      actualCompletedLearningChapters: completedCount,
      totalCourseChaptersForLearning: totalCount
    };
  }, [course, chapters]); // CHANGED: Dependency array now includes `chapters`

  if (loading && !course) {
    return (
      <Container
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          gap: '1rem'
        }}
      >
        <Loader size="xl" variant="dots" />
        <Text size="lg" color="dimmed">
          {t('loadingCourseDetails')}
        </Text>
        <Text size="sm" color="dimmed" mt="xs">
          {t('creation.preparingYourCourse')}
        </Text>
      </Container>
    );
  }

  if (error && !course) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t('errors.genericTitle')}
          color="red"
          mb="lg"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  const showNonCriticalError = error && course;

  return (
    <Container size="lg" py="xl">
      {/* NEW: First-time video popup */}
      <Modal
        opened={showVideoPopup}
        onClose={closeVideoPopup}
        fullScreen
        padding={0}
        withCloseButton={false}
        overlayProps={{
          color: '#000',
          opacity: 0.95,
        }}
        styles={{
          content: {
            background: 'transparent',
          },
          body: {
            padding: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '90%',
            maxWidth: '1000px',
            height: '80%',
            maxHeight: '600px',
          }}
        >
          {/* Close button */}
          <ActionIcon
            size="xl"
            radius="xl"
            color="white"
            variant="filled"
            onClick={closeVideoPopup}
            sx={{
              position: 'absolute',
              top: -60,
              right: 0,
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#000',
              '&:hover': {
                background: 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <IconX size={24} />
          </ActionIcon>

          {/* Video container */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/uRXTp_C2jYk?autoplay=1&rel=0"
              title="Welcome Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                borderRadius: '12px',
              }}
            />
          </Box>

          {/* Welcome text above video */}
          <Box
            sx={{
              position: 'absolute',
              top: -120,
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            <Stack spacing="xs">
              <Group position="center" spacing="xs">
                <ThemeIcon size="lg" radius="xl" color="teal" variant="filled">
                  <IconPlayerPlay size={20} />
                </ThemeIcon>
                <Title order={2} color="white" weight={600}>
                  Welcome to your AI Learning Journey!
                </Title>
              </Group>
              <Text color="rgba(255, 255, 255, 0.8)" size="lg">
                Watch this quick intro to get the most out of your personalized course
              </Text>
            </Stack>
          </Box>
        </Box>
      </Modal>

      {showNonCriticalError && (
         <Alert
         icon={<IconAlertCircle size={16} />}
         title={t('errors.genericTitle')}
         color="orange"
         mb="lg"
         withCloseButton
         onClose={() => clearError()}
       >
         {error}
       </Alert>
      )}

      {course?.status === "creating" && (
        <Paper
          radius="md"
          p="xl"
          withBorder
          mb="xl"
          sx={(theme) => ({
            position: 'relative',
            overflow: 'hidden', backgroundColor: theme.white,
          })}
        >
          <Box
            sx={(theme) => ({
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              opacity: 0.05,
              backgroundImage: (course && course.image_url) ? `url("${course.image_url}")` : 'url("https://cdn-icons-png.flaticon.com/512/8136/8136031.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              [theme.fn.smallerThan('md')]: {
                width: '100%',
              },
            })}
          />

          <Group position="apart" mb="xl">
            <Box>
              <Badge color="blue" variant="filled" size="lg" radius="sm" mb="sm">
                <Group spacing="xs">
                  <IconBrain size={16} />
                  <span>{t('creation.aiInActionBadge')}</span>
                </Group>
              </Badge>
              <Title
                order={2}
                sx={{
                  fontWeight: 800,
                  fontSize: '1.8rem',
                }}
              >
                {t('creation.title')}
              </Title>
            </Box>

            <ThemeIcon
              size={60}
              radius="xl"
              color={creationProgressUI.percentage === 100 ? "green" : "cyan"}
              variant="light"
              sx={{ border: '4px solid #f0f0f0' }}
            >
              {creationProgressUI.percentage === 100 ?
                <IconCheck size={30} /> :
                <IconClock size={30} />
              }
            </ThemeIcon>
          </Group>

          <Box mb="xl">
            <Group position="apart" mb="xs">
              <Text size="sm" weight={600} color="dimmed">{t('creation.progressLabel')}</Text>
              <Text size="sm" weight={700}>{creationProgressUI.percentage}%</Text>
            </Group>

            <Progress
              value={creationProgressUI.percentage}
              size="lg"
              radius="xl"
              color={creationProgressUI.percentage === 100 ? 'green' : 'teal'}
              animate={creationProgressUI.percentage > 0 && creationProgressUI.percentage < 100}
              sx={{
                height: 12,
                '& .mantine-Progress-bar': creationProgressUI.percentage !== 100 ? {
                  background: 'linear-gradient(90deg, #36D1DC 0%, #5B86E5 100%)'
                } : {}
              }}
            />
          </Box>

          <Box
            py="md"
            px="lg"
            mt="md"
            sx={(theme) => ({
              backgroundColor: theme.fn.rgba(theme.colors.gray[0], 0.7),
              borderRadius: theme.radius.md,
              position: 'relative',
              zIndex: 2,
            })}
          >
            <Text align="center" size="lg" weight={600} mb="xs" color={creationProgressUI.percentage === 100 ? 'teal' : undefined}>
              {t('creation.currentStatusLabel')} {creationProgressUI.statusText}
            </Text>

            {creationProgressUI.percentage > 0 && creationProgressUI.percentage < 100 && (
              <Text color="dimmed" size="sm" align="center">
                {t('creation.description')}
              </Text>
            )}

            {/* Removed manual reload button - auto-refresh should work via WebSocket */}
            {showRefreshButton && (
              <Group position="center" mt="md">
                <Button
                  variant="outline"
                  color="orange"
                  leftIcon={<IconArrowRight size={16} />}
                  onClick={() => window.location.reload()}
                >
                  {t('buttons.refreshIfStuck')}
                </Button>
              </Group>
            )}
          </Box>

          {creationProgressUI.chaptersCreated > 0 && (
            <Group position="center" mt="md" spacing="xl">
              <Box sx={{ textAlign: 'center' }}>
                <Text size="xl" weight={700}>{creationProgressUI.chaptersCreated}</Text>
                <Text size="xs" color="dimmed">{t('creation.chaptersCreatedLabel_one')}</Text>
              </Box>

              <Divider orientation="vertical" />

              <Box sx={{ textAlign: 'center' }}>
                <Text size="xl" weight={700}>{creationProgressUI.estimatedTotal || t('creation.calculating')}</Text>
                <Text size="xs" color="dimmed">{t('creation.estimatedTotalLabel')}</Text>
              </Box>

              <Divider orientation="vertical" />

              <Box sx={{ textAlign: 'center' }}>
                <Text size="xl" weight={700}>{course?.total_time_hours || t('creation.calculating')} hrs</Text>
                <Text size="xs" color="dimmed">{t('creation.learningTimeLabel')}</Text>
              </Box>
            </Group>
          )}
        </Paper>
      )}

      {course && (
        <>
          <Paper
            radius="md"
            p={0}
            withBorder
            mb="xl"
            sx={(theme) => ({
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: theme.white,
            })}
          >
            <Grid gutter={0}>
              <Grid.Col md={7}>
                <Box p="xl">
                  <Group position="apart">
                    <Button
                      variant="subtle"
                      leftIcon={<IconArrowBack size={16} />}
                      onClick={() => navigate('/dashboard')}
                      mb="md"
                    >
                      {t('buttons.backToDashboard')}
                    </Button>

                    {course.status === "creating" ? (
                      <Badge size="lg" color="blue" variant="filled" px="md" py="sm">
                        <Group spacing="xs" noWrap>
                          <IconClock size={16} />
                          {t('creation.statusCreatingCourse')}
                        </Group>
                      </Badge>
                    ) : (
                      <Badge size="lg" color="teal" variant="filled" px="md" py="sm">
                        {t('progress.percentageComplete', { percentage: learningPercentage })}
                      </Badge>
                    )}
                  </Group>

                  <Title
                    order={1}
                    mb="xs"
                    sx={(theme) => ({
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      backgroundImage: `linear-gradient(45deg, ${theme.colors.teal[7]}, ${theme.colors.cyan[5]})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    })}
                  >
                    {course.title && course.title != 'None' ? course.title : t('courseLoadingTitle')}
                  </Title>

                  <Text size="md" mb="lg" color="dimmed" sx={{ maxWidth: '600px' }}>
                    {course.description && course.description != 'None' ? course.description : t('courseLoadingDescription')}
                  </Text>

                  <Group position="apart" mb="lg">
                    <Box>
                      <Text size="sm" weight={500} color="dimmed">{t('progress.courseProgressLabel')}</Text>
                      <Group spacing="xs" mt="xs">
                        <RingProgress
                          size={60}
                          thickness={4}
                          roundCaps
                          sections={[{ value: learningPercentage, color: 'teal' }]}
                          label={
                            <Text size="xs" align="center" weight={700}>
                              {learningPercentage}%
                            </Text>
                          }
                        />
                        <div>
                          <Text size="md" weight={700}>{actualCompletedLearningChapters} of {totalCourseChaptersForLearning}</Text>
                          <Text size="xs" color="dimmed">{t('progress.chaptersCompletedStats', { completedChapters: actualCompletedLearningChapters, totalChapters: totalCourseChaptersForLearning })}</Text>
                        </div>
                      </Group>
                    </Box>

                    <Box>
                      <Text size="sm" weight={500} color="dimmed">{t('progress.estimatedTimeLabel')}</Text>
                      <Group spacing="xs" mt="xs">
                        <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                          <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                          <Text size="md" weight={700}>{course.total_time_hours || "..."} hours</Text>
                        </div>
                      </Group>
                    </Box>
                  </Group>

                  {course.status !== COURSE_STATUS.CREATING && chapters.length > 0 && chapters[0]?.id !== null && (
                    <Button
                      size="md"
                      variant="gradient"
                      gradient={{ from: 'teal', to: 'cyan' }}
                      rightIcon={<IconChevronRight size={16} />}
                      onClick={() => navigate(`/dashboard/courses/${courseId}/chapters/${chapters[0]?.id}`)}
                      mt="md"
                    >
                      {learningPercentage > 0 ? t('buttons.continueLearning') : t('buttons.startLearning')}
                    </Button>
                  )}
                </Box>
              </Grid.Col>

              <Grid.Col md={5} sx={{ position: 'relative' }}>
                <Image
                  src={course.image_url || "https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png"}
                  height={400}
                  sx={{
                    objectFit: 'cover',
                    height: '100%',
                  }}
                  alt={course.title || t('courseImageAlt')}
                />
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: theme.spacing.md,
                  })}
                >
                  <Group spacing="xs">
                    <ThemeIcon size={32} radius="xl" color="teal" variant="filled">
                      <IconBrain size={18} />
                    </ThemeIcon>
                    <div>
                      <Text color="white" weight={600}>{t('aiGeneratedCourseLabel')}</Text>
                      <Text color="white" opacity={0.7} size="xs">
                        {t('personalizedLearningPathLabel')}
                      </Text>
                    </div>
                  </Group>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>

          <Group position="apart" align="center" mb="xl">
            <Box>
              <Title
                order={2}
                sx={(theme) => ({
                  fontWeight: 700,
                  color: theme.black,
                })}
              >
                {t('learningJourneyLabel')}
              </Title>
              <Text color="dimmed">
                {t('followChaptersLabel')}
              </Text>
            </Box>

            {course.status !== COURSE_STATUS.CREATING && chapters.length > 0 && (
              <Group spacing="xs">
                <ThemeIcon
                  size={34}
                  radius="xl"
                  color={actualCompletedLearningChapters === totalCourseChaptersForLearning && totalCourseChaptersForLearning > 0 ? "green" : "teal"}
                  variant={actualCompletedLearningChapters === totalCourseChaptersForLearning && totalCourseChaptersForLearning > 0 ? "filled" : "light"}
                >
                  {actualCompletedLearningChapters === totalCourseChaptersForLearning && totalCourseChaptersForLearning > 0 ?
                    <IconTrophy size={18} /> :
                    <IconBrain size={18} />
                  }
                </ThemeIcon>
                <div>
                  <Text weight={600} size="sm">
                    {actualCompletedLearningChapters === totalCourseChaptersForLearning && totalCourseChaptersForLearning > 0 ?
                      t('courseMasteredLabel') :
                      `${actualCompletedLearningChapters === 0 ? t('beginLearningLabel') : t('continueLearningLabel')}`}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {actualCompletedLearningChapters === totalCourseChaptersForLearning && totalCourseChaptersForLearning > 0 ?
                      t('congratulationsLabel') :
                      t('progress.chaptersCompletedText', { completedChapters: actualCompletedLearningChapters, totalChapters: totalCourseChaptersForLearning })}
                  </Text>
                </div>
              </Group>
            )}
          </Group>

          {course.status === "creating" && chapters.length === 0 && creationProgressUI.estimatedTotal === 0 && (
            <Paper withBorder p="xl" radius="md" mb="lg" sx={(theme) => ({
              backgroundColor: theme.colors.gray[0],
              textAlign: 'center',
            })}>
              <Loader size="md" mb="md" mx="auto" />
              <Title order={3} mb="sm">{t('creation.buildingCourseLabel')}</Title>
              <Text color="dimmed" size="sm" maw={400} mx="auto">
                {t('creation.creatingHighQualityContentLabel')}
              </Text>
            </Paper>
          )}

          <SimpleGrid
            cols={3}
            spacing="lg"
            breakpoints={[
              { maxWidth: 'md', cols: 2 },
              { maxWidth: 'sm', cols: 1 },
            ]}
          >
            {chapters.map((chapter, index) => {
              return (
                <Card
                  key={chapter.id || index}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  sx={(theme) => ({
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.white,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.shadows.md
                    }
                  })}
                >

                  <Card.Section sx={{ position: 'relative' }}>
                    <Image
                      src={chapter.image_url || "https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png"}
                      alt={chapter.caption || t('chapters.defaultCaptionText', { chapterNumber: index + 1 })}
                      height={180}
                      sx={{
                        objectFit: 'cover'
                      }}
                    />

                    {chapter.is_completed && (
                      <ThemeIcon
                        size={40}
                        radius="xl"
                        color="green"
                        variant="filled"
                        sx={(theme) => ({
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          border: `2px solid ${theme.white}`,
                        })}
                      >
                        <IconCheck size={20} />
                      </ThemeIcon>
                    )}

                    <Box
                      sx={(theme) => ({
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        padding: theme.spacing.xs,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        width: '100%',
                      })}
                    >
                      <Badge
                        color={chapter.is_completed ? "green" : "blue"}
                        variant="filled"
                      >
                        {chapter.is_completed ? t('chapters.statusCompleted') : (learningPercentage > 0 && index === actualCompletedLearningChapters ? t('chapters.statusInProgress') : t('chapters.statusNotStarted'))}
                      </Badge>

                      {chapter.mc_questions && chapter.mc_questions.length > 0 && (
                        <Badge color="yellow" variant="filled" ml={6}>
                          {t('chapters.quizCount', { count: chapter.mc_questions.length })}
                        </Badge>
                      )}
                    </Box>
                  </Card.Section>
                  <Box mt="md" mb="xs" sx={{ flex: 1 }}>
                    <Text
                      weight={700}
                      size="lg"
                      lineClamp={2}
                      sx={{ minHeight: '3.2rem' }}
                    >
                      {chapter.caption || t('chapters.defaultTitleText', { chapterNumber: index + 1 })}
                    </Text>


                    <Text
                      color="dimmed"
                      size="sm"
                      mt="xs"  // Changed from "md" to "xs" for less spacing
                      sx={{ 
                        flex: 1, 
                        height: '5.5rem',  // Fixed height instead of minHeight
                        overflow: 'auto',  // Make it scrollable
                        paddingRight: '4px',  // Small padding for scrollbar space
                        '&::-webkit-scrollbar': {
                          width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#ccc',
                          borderRadius: '2px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: '#999',
                        },
                      }}
                    >
                      {chapter.summary || t('chapters.defaultSummaryText')}
                    </Text>
                  </Box>

                  {chapter.id !== null && (
                    <Button
                      variant={chapter.is_completed ? "light" : "filled"}
                      color={chapter.is_completed ? "green" : "teal"}
                      fullWidth
                      mt="md"
                      rightIcon={chapter.is_completed ? <IconCircleCheck size={16} /> : <IconChevronRight size={16} />}
                      onClick={() => navigate(`/dashboard/courses/${courseId}/chapters/${chapter.id}`)}
                      disabled={chapter.id === null}
                      sx={(theme) =>
                        chapter.is_completed
                          ? {}
                          : {
                            background: `linear-gradient(45deg, ${theme.colors.teal[6]}, ${theme.colors.cyan[5]})`,
                          }
                      }
                    >
                      {chapter.is_completed ? t('buttons.reviewChapter') : t('buttons.startChapter')}
                    </Button>
                  )}
                  {chapter.id === null && (
                    <Button
                      variant="light"
                      color="gray"
                      fullWidth
                      mt="md"
                      rightIcon={<IconCircleCheck size={16} />}
                      disabled
                    >
                      {t('buttons.startChapter')}
                    </Button>
                  )}
                </Card>
              );
            })}

            {course.status === "creating" &&
              creationProgressUI.estimatedTotal > chapters.length &&
              Array.from({ length: creationProgressUI.estimatedTotal - chapters.length }).map((_,idx) => {
                const placeholderIndex = chapters.length + idx;
                return (
                  <Card
                    key={`placeholder-${placeholderIndex}`}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    sx={(theme) => ({
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: theme.fn.rgba(theme.white, 0.8),
                    })}
                  >
                    <Card.Section>
                      <Box sx={{ position: 'relative' }}>
                        <Image
                          src="https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png"
                          height={180}
                          alt={t('creation.upcomingChapterAlt', { chapterNumber: placeholderIndex + 1 })}
                          sx={{ filter: 'blur(3px) grayscale(50%)' }}
                        />
                        <Overlay opacity={0.6} color="#000" />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 20,
                          }}
                        >
                          <Loader color="white" size="md" mb="md" />
                          <Text align="center" color="white" weight={600}>{t('creation.creatingChapterOverlay', { chapterNumber: placeholderIndex + 1 })}</Text>
                          <Text align="center" color="white" size="xs" opacity={0.8}>{t('creation.aiCraftingOverlay')}</Text>
                        </Box>
                      </Box>
                    </Card.Section>
                    <Box mt="md" sx={{ flex: 1 }}>
                      <Text weight={500} color="dimmed">{t('creation.placeholderChapterTitle', { chapterNumber: placeholderIndex + 1 })}</Text>
                      <Box mt="sm" mb="lg">
                        <Box sx={{height: '1rem', width: '80%', backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: '4px', marginBottom: '0.5rem'}} />
                        <Box sx={{height: '1rem', width: '60%', backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: '4px', marginBottom: '0.5rem'}} />
                        <Box sx={{height: '1rem', width: '70%', backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: '4px'}} />
                      </Box>
                    </Box>
                    <Button variant="light" color="gray" fullWidth mt="md" disabled>
                      {t('creation.placeholderButtonCreating')}
                    </Button>
                  </Card>
                );
              })}
          </SimpleGrid>
        </>
      )}
    </Container>
  );
}

export default CourseView;