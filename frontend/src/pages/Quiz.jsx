import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Card,
  Text,
  Textarea,
  Button,
  Alert,
  Badge,
  Group,
  Radio,
  Loader,
  Box,
  Title,
  ThemeIcon,
  useMantineTheme,
  Transition,
  Progress,
  Stack,
  createStyles,
} from '@mantine/core';
import { 
  IconBrain, 
  IconPencil, 
  IconCheck, 
  IconX, 
  IconStar,
  IconBulb,
  IconTarget,
  IconSparkles,
  IconQuestionMark
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { courseService } from '../api/courseService';
import AiCodeWrapper from "../components/AiCodeWrapper.jsx";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

const useStyles = createStyles((theme) => ({
  quizContainer: {
    background: 'linear-gradient(135deg, rgba(254, 246, 244, 0.95) 0%, rgba(235, 229, 239, 0.95) 100%)',
    borderRadius: '1.25rem',
    padding: theme.spacing.xl,
    border: `1px solid rgba(156, 123, 172, 0.2)`,
    boxShadow: '0 8px 32px rgba(156, 123, 172, 0.12)',
    backdropFilter: 'blur(12px)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: `linear-gradient(90deg, ${theme.colors.violet[6]}, ${theme.colors.orange[5]})`,
      borderRadius: '1.25rem 1.25rem 0 0',
    },
  },
  
  questionCard: {
    background: `linear-gradient(145deg, ${theme.white} 0%, ${theme.colors.gray[0]} 100%)`,
    border: `1px solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 32px ${theme.colors.gray[4]}40`,
      border: `1px solid ${theme.colors.violet[6]}40`,
    },
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: 4,
      height: '100%',
      background: `linear-gradient(180deg, ${theme.colors.violet[6]}, ${theme.colors.blue[5]})`,
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    
    '&:hover::before': {
      opacity: 1,
    },
  },
  
  questionHeader: {
    background: `linear-gradient(135deg, ${theme.colors.violet[1]}, ${theme.colors.blue[1]})`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    border: `1px solid ${theme.colors.violet[3]}50`,
  },
  
  pointsBadge: {
    background: `linear-gradient(135deg, ${theme.colors.violet[6]}, ${theme.colors.blue[5]})`,
    border: 'none',
    color: theme.white,
    fontWeight: 600,
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    borderRadius: theme.radius.xl,
    boxShadow: `0 4px 12px ${theme.colors.violet[6]}40`,
    '&[data-correct="true"]': {
      background: `linear-gradient(135deg, ${theme.colors.green[6]}, ${theme.colors.teal[5]})`,
      boxShadow: `0 4px 12px ${theme.colors.green[6]}40`,
    },
    '&[data-partial="true"]': {
      background: `linear-gradient(135deg, ${theme.colors.yellow[6]}, ${theme.colors.orange[5]})`,
      boxShadow: `0 4px 12px ${theme.colors.yellow[6]}40`,
    },
    '&[data-incorrect="true"]': {
      background: `linear-gradient(135deg, ${theme.colors.red[6]}, ${theme.colors.pink[5]})`,
      boxShadow: `0 4px 12px ${theme.colors.red[6]}40`,
    },
  },
  
  typeBadge: {
    background: `linear-gradient(135deg, ${theme.colors.gray[1]}, ${theme.colors.gray[0]})`,
    color: theme.colors.gray[7],
    border: `1px solid ${theme.colors.gray[3]}`,
    fontWeight: 500,
    '&[data-type="MC"]': {
      background: `linear-gradient(135deg, ${theme.colors.blue[6]}20, ${theme.colors.cyan[5]}20)`,
      color: theme.colors.blue[6],
      border: `1px solid ${theme.colors.blue[6]}30`,
    },
    '&[data-type="OT"]': {
      background: `linear-gradient(135deg, ${theme.colors.violet[6]}20, ${theme.colors.grape[5]}20)`,
      color: theme.colors.violet[6],
      border: `1px solid ${theme.colors.violet[6]}30`,
    },
  },
  
  radioOption: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.gray[3]}`,
    marginBottom: theme.spacing.sm,
    transition: 'all 0.2s ease',
    background: theme.white,
    
    '&:hover': {
      background: theme.colors.gray[0],
      border: `1px solid ${theme.colors.violet[6]}50`,
      transform: 'translateX(4px)',
    },
    
    '&[data-selected="true"]': {
      background: `linear-gradient(135deg, ${theme.colors.violet[1]}, ${theme.colors.blue[1]})`,
      border: `1px solid ${theme.colors.violet[6]}`,
      transform: 'translateX(8px)',
    },
  },
  
  submitButton: {
    background: `linear-gradient(135deg, ${theme.colors.violet[6]}, ${theme.colors.blue[5]})`,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.sm}px ${theme.spacing.xl}px`,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 16px ${theme.colors.violet[6]}40`,
    
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.colors.violet[7]}, ${theme.colors.blue[6]})`,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${theme.colors.violet[6]}50`,
    },
    
    '&:disabled': {
      background: theme.colors.gray[3],
      transform: 'none',
      boxShadow: 'none',
    },
  },
  
  feedbackAlert: {
    borderRadius: theme.radius.md,
    border: 'none',
    padding: theme.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    
    '&[data-color="green"]': {
      background: `linear-gradient(135deg, ${theme.colors.green[1]}, ${theme.colors.teal[1]})`,
      color: theme.colors.green[8],
    },
    
    '&[data-color="yellow"]': {
      background: `linear-gradient(135deg, ${theme.colors.yellow[1]}, ${theme.colors.orange[1]})`,
      color: theme.colors.yellow[8],
    },
    
    '&[data-color="red"]': {
      background: `linear-gradient(135deg, ${theme.colors.red[1]}, ${theme.colors.pink[1]})`,
      color: theme.colors.red[8],
    },
  },
  
  loadingContainer: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.white})`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl * 2,
    textAlign: 'center',
    border: `1px solid ${theme.colors.gray[2]}`,
  },
  
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing.xl * 2,
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.white})`,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.gray[2]}`,
  },
  
  questionContent: {
    background: theme.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    border: `1px solid ${theme.colors.gray[2]}`,
    marginBottom: theme.spacing.lg,
    position: 'relative',
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      background: `linear-gradient(90deg, ${theme.colors.violet[6]}, ${theme.colors.blue[5]})`,
      borderRadius: `${theme.radius.md}px ${theme.radius.md}px 0 0`,
    },
  },
}));

const Quiz = ({ courseId, chapterId, onQuestionCountChange }) => {
  const { t } = useTranslation('chapterView');
  const { classes } = useStyles();
  const theme = useMantineTheme();
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mcAnswers, setMcAnswers] = useState({});
  const [otAnswers, setOtAnswers] = useState({});
  const [gradingQuestion, setGradingQuestion] = useState(null);
  const [questionFeedback, setQuestionFeedback] = useState({});

  // Fetch quiz questions when component mounts
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const questionsData = await courseService.getChapterQuestions(courseId, chapterId);

        if (questionsData && questionsData.length > 0) {
          setQuestions(questionsData);

          if (onQuestionCountChange) {
            onQuestionCountChange(questionsData.length);
          }

          const initialMCAnswers = {};
          const initialOTAnswers = {};
          const initialFeedback = {};

          questionsData.forEach((question) => {
            if (question.type === 'MC') {
              initialMCAnswers[question.id] = question.users_answer || '';
              if (question.users_answer) {
                const isCorrect = question.users_answer === question.correct_answer;
                initialFeedback[question.id] = {
                  feedback: question.explanation || (isCorrect ? 'Correct!' : 'Incorrect. Please review the material.'),
                  points_received: isCorrect ? 1 : 0,
                  correct_answer: question.correct_answer,
                  is_correct: isCorrect
                };
              }
            } else if (question.type === 'OT') {
              initialOTAnswers[question.id] = question.users_answer || '';
              if (question.feedback) {
                initialFeedback[question.id] = {
                  feedback: question.feedback,
                  points_received: question.points_received,
                  correct_answer: question.correct_answer
                };
              }
            }
          });

          setMcAnswers(initialMCAnswers);
          setOtAnswers(initialOTAnswers);
          setQuestionFeedback(initialFeedback);
        } else {
          if (onQuestionCountChange) {
            onQuestionCountChange(0);
          }
        }

        setError(null);
      } catch (error) {
        setError('Failed to load quiz questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, chapterId, onQuestionCountChange]);

  const handleMCAnswerChange = async (questionId, value) => {
    setMcAnswers(prev => ({ ...prev, [questionId]: value }));

    try {
      const updatedQuestion = await courseService.saveMCAnswer(courseId, chapterId, questionId, value);

      setQuestions(prev => prev.map(q =>
        q.id === questionId ? updatedQuestion : q
      ));

      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const isCorrect = value === question.correct_answer;
      const feedback = {
        feedback: question.explanation || (isCorrect ? 'Correct!' : 'Incorrect. Please review the material.'),
        points_received: isCorrect ? 1 : 0,
        correct_answer: question.correct_answer,
        is_correct: isCorrect
      };

      setQuestionFeedback(prev => ({
        ...prev,
        [questionId]: feedback
      }));

      if (isCorrect) {
        toast.success('Correct answer! 🎉');
      } else {
        toast.error('Incorrect answer. Check the explanation below.');
      }
    } catch (error) {
      console.error('Error saving MC answer:', error);
      toast.error('Failed to save answer. Please try again.');
      setMcAnswers(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const handleOTAnswerChange = (questionId, value) => {
    setOtAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleGradeOpenTextQuestion = async (questionId) => {
    const userAnswer = otAnswers[questionId];
    if (!userAnswer?.trim()) {
      toast.error('Please enter an answer before grading');
      return;
    }

    try {
      setGradingQuestion(questionId);
      const feedback = await courseService.getQuestionFeedback(
        courseId,
        chapterId,
        questionId,
        userAnswer
      );

      setQuestionFeedback(prev => ({
        ...prev,
        [questionId]: feedback
      }));

      toast.success('Your answer has been graded! ✨');
    } catch (error) {
      console.error('Error grading question:', error);
      toast.error('Failed to grade your answer. Please try again.');
    } finally {
      setGradingQuestion(null);
    }
  };

  const getQuestionColor = (question, questionId) => {
    const feedback = questionFeedback[questionId];
    let points = null;
    const isOT = question.type === 'OT';
    const maxPoints = isOT ? 2 : 1;

    if (feedback?.points_received !== undefined && feedback.points_received !== null) {
      points = feedback.points_received;
    } else if (question.points_received !== undefined && question.points_received !== null) {
      points = question.points_received;
    } else {
      return 'gray';
    }

    if (points === 0) return 'red';
    if (points === 1 && maxPoints === 1) return 'green';
    if (points === 1 && maxPoints === 2) return 'yellow';
    if (points === 2) return 'green';
    return 'gray';
  };

  const getQuestionPoints = (question, questionId) => {
    const feedback = questionFeedback[questionId];
    const maxPoints = question.type === 'OT' ? 2 : 1;

    if (feedback?.points_received !== undefined && feedback.points_received !== null) {
      return `${feedback.points_received}/${maxPoints}`;
    } else if (question.points_received !== undefined && question.points_received !== null) {
      return `${question.points_received}/${maxPoints}`;
    }

    return `${maxPoints} Point${maxPoints > 1 ? 's' : ''}`;
  };

  const getFeedbackTitle = (question, questionId) => {
    const feedback = questionFeedback[questionId];
    let points = null;
    const isOT = question.type === 'OT';
    const maxPoints = isOT ? 2 : 1;

    if (feedback?.points_received !== undefined && feedback.points_received !== null) {
      points = feedback.points_received;
    } else if (question.points_received !== undefined && question.points_received !== null) {
      points = question.points_received;
    } else {
      return null;
    }

    if (points === 0) return 'Incorrect';
    if (points === 1 && maxPoints === 2) return 'Partially Correct';
    return 'Correct';
  };

  const getFeedbackIcon = (color) => {
    switch (color) {
      case 'green': return <IconCheck size={20} />;
      case 'yellow': return <IconStar size={20} />;
      case 'red': return <IconX size={20} />;
      default: return <IconBulb size={20} />;
    }
  };

  const getCompletionStats = () => {
    let answered = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question) => {
      const maxPoints = question.type === 'OT' ? 2 : 1;
      totalPoints += maxPoints;
      
      const feedback = questionFeedback[question.id];
      const hasAnswer = question.type === 'MC' ? mcAnswers[question.id] : otAnswers[question.id];
      
      if (hasAnswer || question.users_answer) {
        answered++;
      }
      
      if (feedback?.points_received !== undefined) {
        earnedPoints += feedback.points_received;
      } else if (question.points_received !== undefined) {
        earnedPoints += question.points_received;
      }
    });

    return { answered, total: questions.length, totalPoints, earnedPoints };
  };

  if (loading) {
    return (
      <Paper className={classes.loadingContainer}>
        <Stack align="center" spacing="md">
          <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
            <IconBrain size={30} />
          </ThemeIcon>
          <Loader size="lg" variant="dots" />
          <Title order={4}>Loading Quiz...</Title>
          <Text color="dimmed">Preparing your questions</Text>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper className={classes.loadingContainer}>
        <Alert 
          color="red" 
          title="Error"
          icon={<IconX size={20} />}
          className={classes.feedbackAlert}
          data-color="red"
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!questions.length) {
    return (
      <Paper className={classes.emptyState}>
        <Stack align="center" spacing="md">
          <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'gray', to: 'blue' }}>
            <IconSparkles size={40} />
          </ThemeIcon>
          <Title order={3} color="dimmed">No Quiz Available</Title>
          <Text color="dimmed" size="lg">
            No quiz questions are available for this chapter yet.
          </Text>
        </Stack>
      </Paper>
    );
  }

  const stats = getCompletionStats();

  return (
    <Paper className={classes.quizContainer}>
      {/* Quiz Header */}
      <Group position="apart" align="flex-start" mb="xl">
        <Stack spacing="xs">
          <Group spacing="md" align="center">
            <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
              <IconQuestionMark size={25} />
            </ThemeIcon>
            <Box>
              <Title order={2} weight={700}>
                Chapter Quiz
              </Title>
              <Text color="dimmed" size="sm">
                Test your understanding of the material
              </Text>
            </Box>
          </Group>
        </Stack>
        
        <Stack spacing="xs" align="flex-end">
          <Badge 
            size="lg" 
            variant="gradient" 
            gradient={{ from: 'violet', to: 'blue' }}
            sx={{ fontWeight: 600 }}
          >
            {stats.answered}/{stats.total} Questions
          </Badge>
          <Progress 
            value={(stats.answered / stats.total) * 100} 
            size="md" 
            radius="xl"
            sx={{ width: 120 }}
            color="violet"
          />
          {stats.totalPoints > 0 && (
            <Text size="xs" color="dimmed">
              {stats.earnedPoints}/{stats.totalPoints} Points
            </Text>
          )}
        </Stack>
      </Group>

      {/* Questions */}
      {questions.map((question, index) => {
        const isOT = question.type === 'OT';
        const color = getQuestionColor(question, question.id);
        const isAnswered = isOT ? 
          (otAnswers[question.id] || question.users_answer) && (questionFeedback[question.id] || question.feedback) :
          mcAnswers[question.id] || question.users_answer;
        
        return (
          <Transition
            key={`${question.type}-${question.id}`}
            mounted={true}
            transition="slide-up"
            duration={300}
            timingFunction="ease"
          >
            {(styles) => (
              <Card className={classes.questionCard} style={styles}>
                {/* Question Header */}
                <div className={classes.questionHeader}>
                  <Group position="apart" align="flex-start" mb="sm">
                    <Group spacing="md" align="center">
                      <ThemeIcon 
                        size={36} 
                        radius="xl" 
                        variant="gradient" 
                        gradient={{ from: 'violet', to: 'blue' }}
                      >
                        <Text size="sm" weight={700}>
                          {index + 1}
                        </Text>
                      </ThemeIcon>
                      
                      <Badge 
                        className={classes.typeBadge}
                        data-type={question.type}
                        leftSection={isOT ? <IconPencil size={14} /> : <IconTarget size={14} />}
                      >
                        {isOT ? t('quiz.badge.openText') : t('quiz.badge.multipleChoice')}
                      </Badge>
                    </Group>

                    <Badge 
                      className={classes.pointsBadge}
                      data-correct={color === 'green'}
                      data-partial={color === 'yellow'}
                      data-incorrect={color === 'red'}
                      leftSection={
                        isAnswered ? getFeedbackIcon(color) : <IconStar size={14} />
                      }
                    >
                      {getQuestionPoints(question, question.id)}
                    </Badge>
                  </Group>

                {/* Question Content */}
                <Box className={classes.questionContent}>
                  <AiCodeWrapper Background={false}>
                    {question.question}
                  </AiCodeWrapper>
                </Box>
                </div>

                {/* Question Type Specific Content */}
                {isOT ? (
                  /* Open Text Question */
                  !questionFeedback[question.id] && !question.feedback ? (
                    <Stack spacing="md">
                      <Textarea
                        placeholder={t('quiz.openText.placeholder')}
                        value={otAnswers[question.id] || ''}
                        onChange={(e) => handleOTAnswerChange(question.id, e.target.value)}
                        minRows={4}
                        radius="md"
                        styles={{
                          input: {
                            border: `1px solid ${theme.colors.gray[3]}`,
                            '&:focus': {
                              borderColor: theme.colors.violet[6],
                            },
                          },
                        }}
                      />
                      <Group position="right">
                        <Button
                          className={classes.submitButton}
                          onClick={() => handleGradeOpenTextQuestion(question.id)}
                          loading={gradingQuestion === question.id}
                          disabled={!otAnswers[question.id]?.trim()}
                          leftIcon={<IconBrain size={16} />}
                        >
                          {t('quiz.openText.gradeButton')}
                        </Button>
                      </Group>
                    </Stack>
                  ) : (
                    /* Show feedback */
                    <Stack spacing="md">
                      <Textarea
                        value={otAnswers[question.id] || question.users_answer || ''}
                        minRows={4}
                        disabled
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: theme.colors.gray[1],
                            color: theme.colors.gray[7],
                            cursor: 'not-allowed',
                            border: `1px solid ${theme.colors.gray[3]}`,
                          },
                        }}
                      />
                      {(questionFeedback[question.id]?.feedback || question.feedback) && (
                        <Alert
                          className={classes.feedbackAlert}
                          data-color={color}
                          title={
                            <Group spacing="xs">
                              {getFeedbackIcon(color)}
                              <Text weight={600}>
                                {getFeedbackTitle(question, question.id)} (AI Feedback)
                              </Text>
                            </Group>
                          }
                        >
                          <Text>{questionFeedback[question.id]?.feedback || question.feedback}</Text>
                        </Alert>
                      )}
                    </Stack>
                  )
                ) : (
                  /* Multiple Choice Question */
                  <Stack spacing="md">
                    <Radio.Group
                      value={mcAnswers[question.id]}
                      onChange={(value) => handleMCAnswerChange(question.id, value)}
                      name={`question-${question.id}`}
                    >
                      <Stack spacing="xs">
                        {['a', 'b', 'c', 'd'].map((option) => (
                          <div
                            key={option}
                            className={classes.radioOption}
                            data-selected={mcAnswers[question.id] === option}
                          >
                            <Radio 
                              value={option} 
                              label={
                              <Latex>
                                {question[`answer_${option}`]}
                              </Latex>}
                              styles={{
                                radio: {
                                  '&:checked': {
                                    backgroundColor: theme.colors.violet[6],
                                    borderColor: theme.colors.violet[6],
                                  },
                                },
                                label: {
                                  fontWeight: 500,
                                },
                              }}
                            />
                          </div>
                        ))}
                      </Stack>
                    </Radio.Group>

                    {(questionFeedback[question.id] || (question.users_answer && question.feedback)) && (
                      <Alert
                        className={classes.feedbackAlert}
                        data-color={color}
                        title={
                          <Group spacing="xs">
                            {getFeedbackIcon(color)}
                            <Text weight={600}>
                              {getFeedbackTitle(question, question.id)}
                            </Text>
                          </Group>
                        }
                      >
                        <Stack spacing="xs">
                          {!(questionFeedback[question.id]?.is_correct ?? (question.users_answer === question.correct_answer)) && (
                            <Text>
                              <strong>Correct answer:</strong> {question[`answer_${question.correct_answer}`]}
                            </Text>
                          )}
                          {(questionFeedback[question.id]?.feedback || question.explanation) && (
                            <Latex>{questionFeedback[question.id]?.feedback || question.explanation}</Latex>
                          )}
                        </Stack>
                      </Alert>
                    )}
                  </Stack>
                )}
              </Card>
            )}
          </Transition>
        );
      })}
    </Paper>
  );
};

export default Quiz;