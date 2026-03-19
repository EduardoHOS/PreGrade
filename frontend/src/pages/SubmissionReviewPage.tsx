import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, VStack, HStack, Button, Card, CardBody, CardHeader,
  Badge, Divider, Textarea, Input, Icon, Skeleton, Progress,
  Alert, AlertIcon, useToast, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Check, X, Edit3, Zap, MessageSquare, HelpCircle } from 'lucide-react';
import api from '../lib/api';

const MotionBox = motion(Box);

// ── Helpers ──

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red';
  return (
    <HStack spacing={2}>
      <Progress value={pct} size="sm" colorScheme={color} flex={1} h="4px" />
      <Text fontSize="11px" color="brand.400" minW="35px" fontWeight={500}>{pct}%</Text>
    </HStack>
  );
}

function AIBadge() {
  return (
    <Badge bg="ai.50" color="ai.700" fontSize="10px" borderRadius="5px" px={1.5} py="1px">
      <HStack spacing={1}><Icon as={Sparkles} boxSize={2.5} /><Text>AI Suggestion</Text></HStack>
    </Badge>
  );
}

// Evidence highlighting
const HIGHLIGHT_COLORS = [
  { bg: 'rgba(155, 107, 198, 0.12)', border: 'rgba(155, 107, 198, 0.35)' },
  { bg: 'rgba(35, 131, 226, 0.12)', border: 'rgba(35, 131, 226, 0.35)' },
  { bg: 'rgba(232, 125, 36, 0.12)', border: 'rgba(232, 125, 36, 0.35)' },
  { bg: 'rgba(46, 139, 87, 0.12)', border: 'rgba(46, 139, 87, 0.35)' },
];

interface EvidenceSpan {
  start: number;
  end: number;
  colorIdx: number;
  criterionTitle: string;
}

function findEvidenceSpans(text: string, rubricScores: any[], criteria: any[]): EvidenceSpan[] {
  const spans: EvidenceSpan[] = [];
  const lowerText = text.toLowerCase();

  rubricScores.forEach((rs: any, idx: number) => {
    const criterion = criteria.find((c: any) => c.id === rs.criterionId);
    const colorIdx = idx % HIGHLIGHT_COLORS.length;
    const evidence = rs.aiKeyEvidence || [];

    evidence.forEach((quote: string) => {
      const lowerQuote = quote.toLowerCase().trim();
      if (lowerQuote.length < 8) return;
      const pos = lowerText.indexOf(lowerQuote);
      if (pos !== -1) {
        spans.push({ start: pos, end: pos + lowerQuote.length, colorIdx, criterionTitle: criterion?.title || 'Unknown' });
      }
    });
  });

  spans.sort((a, b) => a.start - b.start);
  const filtered: EvidenceSpan[] = [];
  let lastEnd = 0;
  for (const span of spans) {
    if (span.start >= lastEnd) {
      filtered.push(span);
      lastEnd = span.end;
    }
  }
  return filtered;
}

function HighlightedSubmission({ text, rubricScores, criteria }: { text: string; rubricScores: any[]; criteria: any[] }) {
  const spans = useMemo(() => findEvidenceSpans(text, rubricScores, criteria), [text, rubricScores, criteria]);

  if (spans.length === 0) {
    return <Box fontSize="13px" lineHeight="1.9" whiteSpace="pre-wrap" color="brand.700">{text}</Box>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  spans.forEach((span, i) => {
    if (span.start > cursor) {
      parts.push(<span key={`t${i}`}>{text.slice(cursor, span.start)}</span>);
    }
    const color = HIGHLIGHT_COLORS[span.colorIdx];
    parts.push(
      <Box
        key={`h${i}`}
        as="mark"
        bg={color.bg}
        borderBottom="2px solid"
        borderColor={color.border}
        borderRadius="2px"
        px="2px"
        mx="-2px"
        title={`Evidence for: ${span.criterionTitle}`}
        cursor="help"
        sx={{ color: 'inherit', fontStyle: 'normal' }}
        transition="background 0.15s ease"
        _hover={{ bg: color.border }}
      >
        {text.slice(span.start, span.end)}
      </Box>
    );
    cursor = span.end;
  });

  if (cursor < text.length) {
    parts.push(<span key="last">{text.slice(cursor)}</span>);
  }

  return <Box fontSize="13px" lineHeight="1.9" whiteSpace="pre-wrap" color="brand.700">{parts}</Box>;
}

// ── Quiz Answer Card ──

function QuizAnswerCard({ answer, index, submissionId, onGrade }: {
  answer: any; index: number; submissionId: string; onGrade: () => void;
}) {
  const toast = useToast();
  const [points, setPoints] = useState<number>(answer.pointsAwarded ?? 0);
  const [feedback, setFeedback] = useState<string>(answer.feedback || '');
  const [editing, setEditing] = useState(false);

  const isManual = answer.question.type === 'PARAGRAPH' || answer.question.type === 'FILE_UPLOAD';
  const isGraded = answer.isCorrect !== null || answer.pointsAwarded !== null;
  const maxPoints = answer.question.points;

  const gradeMutation = useMutation({
    mutationFn: () => api.patch(`/grading/submissions/${submissionId}/answers/${answer.id}/grade`, {
      points,
      feedback: feedback || undefined,
    }),
    onSuccess: () => {
      toast({ title: 'Answer graded', status: 'success', duration: 2000 });
      setEditing(false);
      onGrade();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to grade', description: err.response?.data?.error, status: 'error', duration: 3000 });
    },
  });

  return (
    <Box
      p={4}
      borderRadius="10px"
      bg={isManual && !isGraded ? 'warning.50' : 'brand.50'}
      border="1px solid"
      borderColor={isManual && !isGraded ? 'warning.100' : 'brand.100'}
      transition="all 0.2s ease"
    >
      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          <Flex
            align="center" justify="center"
            w="22px" h="22px"
            borderRadius="6px"
            bg={isManual ? 'warning.100' : 'brand.100'}
          >
            <Text fontSize="10px" fontWeight={700} color={isManual ? 'warning.600' : 'brand.500'}>
              {index + 1}
            </Text>
          </Flex>
          <Text fontSize="13px" fontWeight={500} color="brand.700">{answer.question.text}</Text>
        </HStack>
        <Badge
          bg={answer.question.type === 'PARAGRAPH' ? 'warning.50' : 'brand.50'}
          color={answer.question.type === 'PARAGRAPH' ? 'warning.600' : 'brand.500'}
          fontSize="10px"
          borderRadius="4px"
        >
          {answer.question.type.replace('_', ' ').toLowerCase()}
        </Badge>
      </HStack>

      {/* Student answer */}
      <Box
        bg="white"
        borderRadius="8px"
        px={3} py={2.5}
        mb={2}
        border="1px solid"
        borderColor="brand.100"
      >
        <Text fontSize="13px" color="brand.600" lineHeight={1.7} whiteSpace="pre-wrap">
          {answer.answerValue}
        </Text>
      </Box>

      {/* Auto-graded result */}
      {!isManual && isGraded && (
        <HStack spacing={2}>
          <Badge
            bg={answer.isCorrect ? 'confirm.50' : 'red.50'}
            color={answer.isCorrect ? 'confirm.600' : 'accent.red'}
            fontSize="11px"
            borderRadius="5px"
          >
            {answer.isCorrect ? 'Correct' : 'Incorrect'}
          </Badge>
          <Text fontSize="12px" color="brand.500" fontWeight={500}>
            {answer.pointsAwarded ?? 0}/{maxPoints} pts
          </Text>
        </HStack>
      )}

      {/* Manual grading UI */}
      {isManual && (
        <Box mt={2}>
          {isGraded && !editing ? (
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Badge bg="confirm.50" color="confirm.600" fontSize="11px" borderRadius="5px">
                  Graded
                </Badge>
                <Text fontSize="12px" fontWeight={500} color="brand.600">
                  {answer.pointsAwarded}/{maxPoints} pts
                </Text>
              </HStack>
              <Button
                size="xs" variant="ghost" color="brand.400"
                leftIcon={<Icon as={Edit3} boxSize={3} />}
                onClick={() => { setPoints(answer.pointsAwarded ?? 0); setFeedback(answer.feedback || ''); setEditing(true); }}
                _hover={{ color: 'brand.700' }}
              >
                Edit
              </Button>
            </HStack>
          ) : (
            <VStack spacing={3} align="stretch">
              <HStack spacing={2} align="center">
                <Icon as={HelpCircle} boxSize={3.5} color="warning.500" />
                <Text fontSize="12px" color="warning.600" fontWeight={500}>
                  {editing ? 'Update score' : 'Requires manual grading'}
                </Text>
              </HStack>
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="11px" color="brand.500" fontWeight={500}>Points</Text>
                  <HStack spacing={1}>
                    <Input
                      size="xs" w="50px" textAlign="center" fontWeight={600}
                      value={points}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 0 && v <= maxPoints) setPoints(v);
                        else if (e.target.value === '') setPoints(0);
                      }}
                      borderRadius="6px"
                    />
                    <Text fontSize="11px" color="brand.400">/ {maxPoints}</Text>
                  </HStack>
                </HStack>
                <Slider value={points} min={0} max={maxPoints} step={1} onChange={setPoints} colorScheme="purple">
                  <SliderTrack h="5px"><SliderFilledTrack /></SliderTrack>
                  <SliderThumb boxSize={4} />
                </Slider>
              </Box>
              <Textarea
                size="xs" value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2} placeholder="Feedback (optional)..."
                fontSize="12px" borderRadius="8px"
              />
              <HStack>
                <Button
                  size="xs" bg="confirm.500" color="white"
                  _hover={{ bg: 'confirm.600' }}
                  onClick={() => gradeMutation.mutate()}
                  isLoading={gradeMutation.isPending}
                  borderRadius="6px"
                >
                  {editing ? 'Update' : 'Grade'}
                </Button>
                {editing && (
                  <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                )}
              </HStack>
            </VStack>
          )}
        </Box>
      )}

      {/* Feedback */}
      {answer.feedback && !editing && (
        <HStack mt={2} spacing={1.5}>
          <Icon as={MessageSquare} boxSize={3} color="brand.400" />
          <Text fontSize="11px" color="brand.500">{answer.feedback}</Text>
        </HStack>
      )}
    </Box>
  );
}

// ── Main Page ──

export default function SubmissionReviewPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get(`/submissions/${submissionId}`).then(r => r.data.data),
  });

  const reviewMutation = useMutation({
    mutationFn: (params: { gradeId: string; criterionId: string; finalPoints: number; finalFeedback?: string }) =>
      api.patch(`/grades/${params.gradeId}/criteria/${params.criterionId}`, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      toast({ title: 'Criterion reviewed', status: 'success', duration: 2000 });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (gradeId: string) => api.post(`/grades/${gradeId}/confirm`, { reviewStartedAt: Date.now() - 60000 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['grading-queue'] });
      toast({ title: 'Grade confirmed!', status: 'success', duration: 3000 });
    },
  });

  const triggerAIMutation = useMutation({
    mutationFn: () => api.post(`/submissions/${submissionId}/trigger-ai`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      toast({ title: 'AI grading complete', status: 'success', duration: 3000 });
    },
    onError: (err: any) => {
      toast({ title: 'AI grading failed', description: err.response?.data?.error || 'Check your GROQ_API_KEY', status: 'error', duration: 5000 });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => api.post(`/grading/submissions/${submissionId}/finalize-grade`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['grading-queue'] });
      toast({ title: 'Grade finalized!', status: 'success', duration: 3000 });
    },
    onError: (err: any) => {
      toast({ title: 'Finalization failed', description: err.response?.data?.error, status: 'error', duration: 5000 });
    },
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton h="32px" w="200px" mb={4} />
        <Skeleton h="400px" borderRadius="12px" />
      </Box>
    );
  }

  if (!submission) {
    return <Alert status="error" borderRadius="10px"><AlertIcon />Submission not found</Alert>;
  }

  const grade = submission.grade;
  const rubricScores = grade?.rubricScores || [];
  const criteria = submission.assignment?.rubric?.criteria || [];
  const isEssay = submission.assignment?.type === 'ESSAY';
  const isQuiz = submission.assignment?.type === 'QUIZ';
  const allReviewed = rubricScores.length > 0 && rubricScores.every((rs: any) => rs.teacherReviewAction);
  const isComplete = grade?.status === 'COMPLETE';

  // Quiz: check if all manual questions are graded
  const answers = submission.answers || [];
  const manualAnswers = answers.filter((a: any) => a.question.type === 'PARAGRAPH' || a.question.type === 'FILE_UPLOAD');
  const allManualGraded = manualAnswers.every((a: any) => a.pointsAwarded !== null);
  const quizCanFinalize = isQuiz && !isComplete && allManualGraded;

  const refreshSubmission = () => {
    queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
  };

  return (
    <Box>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack mb={6} spacing={3}>
          <Button
            variant="ghost" size="sm"
            leftIcon={<Icon as={ArrowLeft} boxSize={4} />}
            onClick={() => navigate('/teacher/grading')}
            color="brand.400"
            _hover={{ color: 'brand.700' }}
          >
            Back
          </Button>
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="12px" color="brand.400">{submission.user.firstName} {submission.user.lastName}</Text>
            <Heading size="sm" color="brand.700" fontWeight={600} letterSpacing="-0.01em">
              {submission.assignment.title}
            </Heading>
          </VStack>
          <HStack spacing={2}>
            {isQuiz && (
              <Badge bg="blue.50" color="blue.700" fontSize="11px" borderRadius="6px" px={2}>
                Quiz
              </Badge>
            )}
            {grade?.status && (
              <Badge
                bg={isComplete ? 'confirm.50' : grade.status === 'AI_GRADED' ? 'ai.50' : 'warning.50'}
                color={isComplete ? 'confirm.600' : grade.status === 'AI_GRADED' ? 'ai.700' : 'warning.600'}
                fontSize="12px" px={3} py={1} borderRadius="8px"
              >
                {isComplete ? 'Confirmed' : grade.status === 'AI_GRADED' ? 'AI Pre-Graded' : grade.status.replace('_', ' ')}
              </Badge>
            )}
          </HStack>
        </HStack>
      </MotionBox>

      {/* AI Re-run button (essays only) */}
      {isEssay && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          mb={4}
        >
          <HStack>
            <Button
              size="sm"
              leftIcon={<Icon as={Zap} boxSize={4} />}
              bg="ai.500" color="white"
              _hover={{ bg: 'ai.600', transform: 'translateY(-1px)', shadow: 'sm' }}
              onClick={() => triggerAIMutation.mutate()}
              isLoading={triggerAIMutation.isPending}
              borderRadius="8px"
            >
              Re-run AI Grading
            </Button>
            {grade?.aiModelUsed && (
              <Text fontSize="11px" color="brand.400">Model: {grade.aiModelUsed}</Text>
            )}
          </HStack>
        </MotionBox>
      )}

      {/* Evidence legend (essays) */}
      {isEssay && rubricScores.length > 0 && (
        <HStack mb={3} spacing={3} flexWrap="wrap">
          <Text fontSize="11px" color="brand.400" fontWeight={500}>Evidence:</Text>
          {criteria.map((c: any, i: number) => {
            const color = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
            return (
              <HStack key={c.id} spacing={1}>
                <Box w={3} h={3} borderRadius="3px" bg={color.bg} border="1px solid" borderColor={color.border} />
                <Text fontSize="11px" color="brand.500">{c.title}</Text>
              </HStack>
            );
          })}
        </HStack>
      )}

      <Flex gap={6} direction={{ base: 'column', lg: 'row' }}>
        {/* Left: Submission content */}
        <MotionBox
          flex={1} minW={0}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card>
            <CardHeader py={3} px={5}>
              <Text fontSize="13px" fontWeight={600} color="brand.700">
                {isQuiz ? 'Quiz Answers' : 'Submission'}
              </Text>
            </CardHeader>
            <Divider />
            <CardBody px={5} py={5}>
              {submission.content ? (
                <HighlightedSubmission
                  text={submission.content}
                  rubricScores={rubricScores}
                  criteria={criteria}
                />
              ) : answers.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                  {answers.map((ans: any, i: number) => (
                    <QuizAnswerCard
                      key={ans.id}
                      answer={ans}
                      index={i}
                      submissionId={submissionId!}
                      onGrade={refreshSubmission}
                    />
                  ))}
                </VStack>
              ) : (
                <Text color="brand.400" fontStyle="italic" fontSize="13px">No content</Text>
              )}
            </CardBody>
          </Card>

          {/* AI Overall Comments */}
          {grade?.aiOverallComments && (
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              mt={4}
            >
              <Card>
                <CardBody px={5} py={4}>
                  <HStack mb={2}><AIBadge /><Text fontSize="13px" fontWeight={600}>Overall Assessment</Text></HStack>
                  <Text fontSize="13px" color="brand.600" lineHeight="1.8">{grade.aiOverallComments}</Text>
                </CardBody>
              </Card>
            </MotionBox>
          )}

          {/* Quiz finalize button */}
          {isQuiz && (
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              mt={4}
            >
              {isComplete ? (
                <Alert status="success" borderRadius="10px" fontSize="13px">
                  <AlertIcon />
                  Grade finalized. Total: {grade.points}/{grade.maxPoints} pts
                </Alert>
              ) : (
                <Card>
                  <CardBody px={5} py={4}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontSize="13px" fontWeight={600} color="brand.700">Quiz Grade Summary</Text>
                      {grade && (
                        <Text fontSize="lg" fontWeight={700} color="brand.700">
                          {grade.points}<Text as="span" color="brand.400" fontWeight={400}>/{grade.maxPoints}</Text>
                        </Text>
                      )}
                    </HStack>
                    {manualAnswers.length > 0 && !allManualGraded && (
                      <Alert status="warning" fontSize="12px" borderRadius="8px" mb={3} py={2}>
                        <AlertIcon />
                        {manualAnswers.filter((a: any) => a.pointsAwarded === null).length} question(s) still need manual grading
                      </Alert>
                    )}
                    <Button
                      w="full"
                      bg="confirm.500" color="white"
                      _hover={{ bg: 'confirm.600', transform: 'translateY(-1px)' }}
                      size="md"
                      leftIcon={<Icon as={Check} boxSize={4} />}
                      onClick={() => finalizeMutation.mutate()}
                      isLoading={finalizeMutation.isPending}
                      isDisabled={!quizCanFinalize}
                      borderRadius="10px"
                    >
                      {allManualGraded ? 'Finalize Grade' : 'Grade all questions first'}
                    </Button>
                  </CardBody>
                </Card>
              )}
            </MotionBox>
          )}
        </MotionBox>

        {/* Right: Rubric scores (essays only) */}
        {isEssay && criteria.length > 0 && (
          <MotionBox
            w={{ base: 'full', lg: '380px' }} flexShrink={0}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <VStack spacing={3} align="stretch">
              {criteria.map((criterion: any) => {
                const rs = rubricScores.find((s: any) => s.criterionId === criterion.id);
                return (
                  <CriterionCard
                    key={criterion.id}
                    criterion={criterion}
                    rubricScore={rs}
                    gradeId={grade?.id}
                    onReview={(points: number, feedback: string) => {
                      if (grade?.id) {
                        reviewMutation.mutate({ gradeId: grade.id, criterionId: criterion.id, finalPoints: points, finalFeedback: feedback });
                      }
                    }}
                    isReviewing={reviewMutation.isPending}
                    disabled={isComplete}
                  />
                );
              })}

              {/* Confirm button */}
              {grade && !isComplete && (
                <Button
                  bg="confirm.500" color="white"
                  _hover={{ bg: 'confirm.600', transform: 'translateY(-1px)' }}
                  size="md"
                  leftIcon={<Icon as={Check} boxSize={4} />}
                  onClick={() => confirmMutation.mutate(grade.id)}
                  isLoading={confirmMutation.isPending}
                  isDisabled={!allReviewed}
                  borderRadius="10px"
                >
                  {allReviewed ? 'Confirm Grade' : `Review all criteria first (${rubricScores.filter((rs: any) => rs.teacherReviewAction).length}/${criteria.length})`}
                </Button>
              )}

              {isComplete && (
                <Alert status="success" borderRadius="10px" fontSize="13px">
                  <AlertIcon />
                  Grade confirmed. Total: {grade.points}/{grade.maxPoints} pts
                </Alert>
              )}
            </VStack>
          </MotionBox>
        )}
      </Flex>
    </Box>
  );
}

// ── Criterion Card ──

function CriterionCard({ criterion, rubricScore, gradeId, onReview, isReviewing, disabled }: any) {
  const [points, setPoints] = useState<number>(rubricScore?.points || rubricScore?.aiSuggestedPoints || 0);
  const [feedback, setFeedback] = useState<string>(rubricScore?.feedback || rubricScore?.aiSuggestedFeedback || '');
  const [editing, setEditing] = useState(false);

  const hasAI = rubricScore?.aiSuggestedPoints !== null && rubricScore?.aiSuggestedPoints !== undefined;
  const isReviewed = !!rubricScore?.teacherReviewAction;
  const action = rubricScore?.teacherReviewAction;

  const handleAccept = () => {
    onReview(rubricScore.aiSuggestedPoints, rubricScore.aiSuggestedFeedback);
  };

  const handleSaveEdit = () => {
    onReview(points, feedback);
    setEditing(false);
  };

  const borderColor = isReviewed
    ? (action === 'ACCEPT' || action === 'accept' ? 'confirm.100' : action === 'REJECT' || action === 'reject' ? 'red.100' : 'warning.100')
    : hasAI ? 'ai.200' : 'brand.100';

  return (
    <Card borderColor={borderColor} _hover={{ shadow: 'cardHover' }}>
      <CardBody px={4} py={3}>
        <Flex justify="space-between" align="start" mb={2}>
          <Box flex={1}>
            <Text fontSize="13px" fontWeight={600} color="brand.700">{criterion.title}</Text>
            <Text fontSize="11px" color="brand.400">{criterion.maxPoints} pts max</Text>
          </Box>
          {isReviewed && (
            <Badge
              bg={action === 'ACCEPT' || action === 'accept' ? 'confirm.50' : action === 'REJECT' || action === 'reject' ? 'red.50' : 'warning.50'}
              color={action === 'ACCEPT' || action === 'accept' ? 'confirm.600' : action === 'REJECT' || action === 'reject' ? 'accent.red' : 'warning.600'}
              fontSize="10px" borderRadius="5px"
            >
              {(action || '').toLowerCase()}
            </Badge>
          )}
        </Flex>

        {hasAI && (
          <>
            <HStack justify="space-between" mb={1}>
              <AIBadge />
              <Text fontSize="13px" fontWeight={600} color="ai.600">{rubricScore.aiSuggestedPoints}/{criterion.maxPoints}</Text>
            </HStack>
            <ConfidenceMeter confidence={rubricScore.aiConfidence || 0} />
            {rubricScore.aiSuggestedFeedback && (
              <Text fontSize="12px" color="brand.500" mt={2} lineHeight="1.6">{rubricScore.aiSuggestedFeedback}</Text>
            )}
          </>
        )}

        {!disabled && !isReviewed && hasAI && !editing && (
          <HStack mt={3} spacing={2}>
            <Button
              size="xs" variant="outline" borderColor="confirm.100" color="confirm.500"
              _hover={{ bg: 'confirm.50', borderColor: 'confirm.500' }}
              leftIcon={<Icon as={Check} boxSize={3} />}
              onClick={handleAccept} isLoading={isReviewing}
              borderRadius="6px"
            >
              Accept
            </Button>
            <Button
              size="xs" variant="outline" borderColor="warning.100" color="warning.500"
              _hover={{ bg: 'warning.50', borderColor: 'warning.500' }}
              leftIcon={<Icon as={Edit3} boxSize={3} />}
              onClick={() => setEditing(true)}
              borderRadius="6px"
            >
              Modify
            </Button>
            <Button
              size="xs" variant="outline" borderColor="red.100" color="accent.red"
              _hover={{ bg: 'red.50', borderColor: 'accent.red' }}
              leftIcon={<Icon as={X} boxSize={3} />}
              onClick={() => onReview(0, '')} isLoading={isReviewing}
              borderRadius="6px"
            >
              Reject
            </Button>
          </HStack>
        )}

        {editing && (
          <VStack mt={3} spacing={3} align="stretch">
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="11px" color="brand.500" fontWeight={500}>Points</Text>
                <HStack spacing={1}>
                  <Input
                    size="xs" w="50px" textAlign="center" fontWeight={600}
                    value={points}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= 0 && v <= criterion.maxPoints) setPoints(v);
                      else if (e.target.value === '') setPoints(0);
                    }}
                    borderRadius="6px"
                  />
                  <Text fontSize="11px" color="brand.400">/ {criterion.maxPoints}</Text>
                </HStack>
              </HStack>
              <Slider value={points} min={0} max={criterion.maxPoints} step={1} onChange={setPoints} colorScheme="purple">
                <SliderTrack h="5px"><SliderFilledTrack /></SliderTrack>
                <SliderThumb boxSize={4} />
              </Slider>
            </Box>
            <Textarea
              size="xs" value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2} placeholder="Feedback..."
              fontSize="12px" borderRadius="8px"
            />
            <HStack>
              <Button
                size="xs" bg="ai.500" color="white"
                _hover={{ bg: 'ai.600' }}
                onClick={handleSaveEdit} isLoading={isReviewing}
                borderRadius="6px"
              >
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </HStack>
          </VStack>
        )}

        {isReviewed && (
          <Box mt={2} p={2.5} bg="brand.50" borderRadius="8px">
            <Text fontSize="12px" fontWeight={500} color="brand.700">
              Final: {rubricScore.points}/{criterion.maxPoints} pts
            </Text>
            {rubricScore.feedback && <Text fontSize="11px" color="brand.500" mt={1}>{rubricScore.feedback}</Text>}
          </Box>
        )}
      </CardBody>
    </Card>
  );
}
