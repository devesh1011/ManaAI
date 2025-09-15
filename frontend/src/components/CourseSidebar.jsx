import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { Box, NavLink, Text, Button, ThemeIcon, Loader, useMantineTheme, ActionIcon } from '@mantine/core';
import {
  IconHome2,
  IconChevronRight,
  IconChevronDown,
  IconFileText,
  IconPhoto,
  IconQuestionMark,
  IconCircleCheck,
  IconCircleDashed,
  IconSchool,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useCourse } from '../contexts/CourseContext';
import {MainLink} from "../layouts/AppLayout.jsx";
import {useMediaQuery} from "@mantine/hooks";

const ChapterLink = ({ chapter, index, handleChapterClick, handleNavigation, chapterId, opened, currentTab, isExpanded }) => {
  const theme = useMantineTheme();

  // Check if chapter has quiz questions (updated in real-time via WebSocket)
  const hasQuestions = chapter.quiz_questions && chapter.quiz_questions.length > 0;

  // When collapsed, render as a simple numbered button
  if (!opened) {
    return (
      <ActionIcon
        key={chapter.id}
        variant={"light"}
        size="xl"
        color={chapter.is_completed ? 'green' : 'gray'}
        onClick={() => handleNavigation(chapter.id, 'content')}
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          marginBottom: theme.spacing.xs,
          minHeight: 48,
          border: chapterId === chapter.id.toString()
            ? `2px solid ${theme.colors.green[9]}`
            : undefined,
        }}
        title={`${index + 1}. ${chapter.caption}`}
      >
        <Text size="sm" weight={600}>{index + 1}</Text>
      </ActionIcon>
    );
  }

  // When expanded, render full navigation structure
  return (
    <div style={{
      backgroundColor: chapterId === chapter.id.toString() ? theme.colors.gray[1] : undefined,
    }}>
    <NavLink
      key={chapter.id}
      label={`${index + 1}. ${chapter.caption}`}
      opened={isExpanded}
      onClick={() => handleChapterClick(chapter.id.toString())}
      style={{
        backgroundColor: chapterId === chapter.id.toString() ? theme.colors.gray[1] : undefined,
      }}
      icon={
        <ThemeIcon variant="light" size="sm" color={chapter.is_completed ? 'green' : 'gray'}>
          {chapter.is_completed ? <IconCircleCheck size={14} /> : <IconCircleDashed size={14} />}
        </ThemeIcon>
      }
      rightSection={isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
    >
      <NavLink
        label="Content"
        icon={<IconFileText size={16} />}
        onClick={(e) => {
          e.stopPropagation();
          handleNavigation(chapter.id, 'content');
        }}
        active={chapterId === chapter.id.toString() && currentTab === 'content'}
        styles={{
          root: {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)', // Replace with your desired color
            },
          },
        }}
      />
      {chapter.file_count > 0 && (
        <NavLink
          label="Files"
          icon={<IconPhoto size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigation(chapter.id, 'files');
          }}
          active={chapterId === chapter.id.toString() && currentTab === 'files'}
          styles={{
            root: {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)', // Replace with your desired color
            },
          },
          }}
        />
      )}
      {hasQuestions && (
        <NavLink
          label="Quiz"
          icon={<IconQuestionMark size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigation(chapter.id, 'quiz');
          }}
          active={chapterId === chapter.id.toString() && currentTab === 'quiz'}
          styles={{
            root: {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)', // Replace with your desired color
            },
          },
          }}
        />
      )}
    </NavLink>
    </div>
  );
};

const CourseSidebar = ({opened, setopen}) => {
  const { t } = useTranslation(['navigation', 'app']);
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, chapterId } = useParams();
  const { course, chapters, loading } = useCourse();

  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Get current tab from URL search params
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'content';

  // Update activeChapter when chapterId changes
  useEffect(() => {
    // Ensure the active chapter is always expanded
    if (chapterId && !expandedChapters.has(chapterId)) {
      setExpandedChapters(prev => new Set([...prev, chapterId]));
    }
  }, [chapterId, expandedChapters]);

  // Toggle chapter expansion
  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  // --- Handlers ---

  const handleChapterClick = (id) => {
    toggleChapter(id);
  };

  const handleNavigation = (chapId, tab) => {
    // Force navigation even if we're already on the same chapter
    const newUrl = `/dashboard/courses/${courseId}/chapters/${chapId}?tab=${tab}`;
    navigate(newUrl);

    // Close mobile sidebar after navigation
    if (isMobile) {
      setopen(false);
    }
  };

  const handleCourseTitleClick = () => {
    navigate(`/dashboard/courses/${courseId}`);

    // Close mobile sidebar after navigation
    if (isMobile) {
      setopen(false);
    }
  };

  const handleNavigate = () => {
    if (isMobile) {
      setopen(false);
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <Box p="md" style={{ textAlign: 'center' }}>
        <Loader />
        <Text size="sm" mt="sm">Loading Course...</Text>
      </Box>
    );
  }

  const link = { icon: <IconHome2 size={20} />, color: 'blue', label: t('home', { ns: 'navigation' }), to: '/dashboard' }

  return (
    <Box>
      <MainLink
        {...link}
        key={link.label}
        isActive={false} // Home is not active when we're in course view
        collapsed={!opened}
        onNavigate={handleNavigate}
      />

      {opened ? (
        <Button
          variant="subtle"
          fullWidth
          onClick={handleCourseTitleClick}
          styles={(theme) => ({
            root: { padding: `0 ${theme.spacing.md}px`, height: 'auto', marginBottom: theme.spacing.md, marginTop: 30 },
            label: { whiteSpace: 'normal', fontSize: theme.fontSizes.lg, fontWeight: 700 },
          })}
        >
          {course?.title && course?.title != "None" ? course?.title : 'Course Overview'}
        </Button>
      ) : (
        <ActionIcon
          variant="transparent"
          size="xl"
          onClick={handleCourseTitleClick}
          style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '30px 0' }}
          title={course?.title || 'Course Overview'}
        >
          <IconSchool size={24} />
        </ActionIcon>
      )}

      {chapters.map((chapter, index) => 
        (chapter.id !== null) ? (
          <ChapterLink
            key={chapter.id}
            chapter={chapter}
            index={index}
            activeChapter={chapterId}
            handleChapterClick={handleChapterClick}
            handleNavigation={handleNavigation}
            chapterId={chapterId}
            opened={opened}
            currentTab={currentTab}
            isExpanded={expandedChapters.has(chapter.id.toString())}
          />
        ) : <></>
      )}
    </Box>
  );
};

export default CourseSidebar;
