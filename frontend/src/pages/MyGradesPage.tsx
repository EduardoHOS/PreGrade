import { useQuery } from '@tanstack/react-query';
import {
  Box, Flex, Heading, Text, VStack, HStack, Card, CardBody, CardHeader,
  Badge, Divider, Skeleton, Icon, Progress,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { GraduationCap, Clock } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const MotionBox = motion(Box);

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function MyGradesPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-grades'],
    queryFn: () => api.get('/my-grades').then(r => r.data.data),
    refetchInterval: 10000,
  });

  const grades = data?.grades || [];
  const pending = data?.pending || [];

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <VStack align="start" spacing={1} mb={8}>
          <Heading size="md" color="brand.700" fontWeight={700} letterSpacing="-0.02em">
            My Grades
          </Heading>
          <Text fontSize="sm" color="brand.400">Welcome back, {user?.firstName}</Text>
        </VStack>
      </MotionBox>

      {isLoading ? (
        <VStack spacing={4}>{[1, 2, 3].map(i => <Skeleton key={i} h="120px" w="full" borderRadius="12px" />)}</VStack>
      ) : grades.length === 0 && pending.length === 0 ? (
        <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardBody py={16} textAlign="center">
              <Icon as={GraduationCap} boxSize={10} color="brand.200" mb={3} />
              <Text color="brand.400" fontSize="sm">No grades available yet</Text>
            </CardBody>
          </Card>
        </MotionBox>
      ) : (
        <MotionBox initial="hidden" animate="show" variants={stagger}>
          <VStack spacing={4} align="stretch">
            {/* Pending submissions */}
            {pending.length > 0 && (
              <MotionBox variants={fadeUp}>
                <Card>
                  <CardHeader py={3} px={5}>
                    <HStack spacing={2}>
                      <Flex align="center" justify="center" w="24px" h="24px" borderRadius="6px" bg="warning.50">
                        <Icon as={Clock} boxSize={3.5} color="warning.500" />
                      </Flex>
                      <Text fontSize="13px" fontWeight={600} color="brand.700">Pending</Text>
                    </HStack>
                  </CardHeader>
                  <Divider />
                  <CardBody px={5} py={2}>
                    <VStack spacing={0} align="stretch" divider={<Divider />}>
                      {pending.map((p: any) => (
                        <HStack key={p.submissionId} justify="space-between" py={3}>
                          <Box>
                            <Text fontSize="13px" fontWeight={500} color="brand.700">{p.assignment.title}</Text>
                            <Text fontSize="11px" color="brand.400">{p.assignment.course.title}</Text>
                          </Box>
                          <Badge bg="warning.50" color="warning.600" fontSize="11px">
                            {p.status === 'grading_in_progress' ? 'Being Graded' : 'Submitted'}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            )}

            {/* Released grades */}
            {grades.map((g: any) => {
              const pct = g.grade.maxPoints > 0 ? Math.round((g.grade.points / g.grade.maxPoints) * 100) : 0;
              const color = pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red';
              return (
                <MotionBox key={g.submissionId} variants={fadeUp}>
                  <Card _hover={{ shadow: 'cardHover', borderColor: 'brand.200' }}>
                    <CardHeader py={4} px={5}>
                      <Flex justify="space-between" align="start">
                        <Box>
                          <Text fontSize="14px" fontWeight={600} color="brand.700">{g.assignment.title}</Text>
                          <Text fontSize="12px" color="brand.400" mt={0.5}>{g.assignment.course.title}</Text>
                        </Box>
                        <VStack spacing={0} align="end">
                          <HStack spacing={1} align="baseline">
                            <Text fontSize="2xl" fontWeight={700} color={`${color}.500`} lineHeight={1}>
                              {g.grade.points}
                            </Text>
                            <Text fontSize="sm" color="brand.400" fontWeight={400}>
                              /{g.grade.maxPoints}
                            </Text>
                          </HStack>
                          <Text fontSize="11px" color="brand.400">{pct}%</Text>
                        </VStack>
                      </Flex>
                      <Progress value={pct} size="xs" colorScheme={color} mt={3} borderRadius="full" />
                    </CardHeader>
                    <Divider />
                    <CardBody px={5} py={4}>
                      {g.grade.feedback && (
                        <Box mb={g.grade.rubricScores?.length > 0 ? 4 : 0}>
                          <Text fontSize="11px" fontWeight={600} color="brand.400" textTransform="uppercase" letterSpacing="0.04em" mb={1.5}>
                            Feedback
                          </Text>
                          <Text fontSize="13px" color="brand.600" lineHeight="1.7">{g.grade.feedback}</Text>
                        </Box>
                      )}

                      {g.grade.rubricScores?.length > 0 && (
                        <Box>
                          <Text fontSize="11px" fontWeight={600} color="brand.400" textTransform="uppercase" letterSpacing="0.04em" mb={2}>
                            Rubric Breakdown
                          </Text>
                          <VStack spacing={2} align="stretch">
                            {g.grade.rubricScores.map((rs: any, i: number) => (
                              <Box key={i} px={3} py={2.5} bg="brand.50" borderRadius="8px">
                                <HStack justify="space-between" mb={1}>
                                  <Text fontSize="12px" fontWeight={500} color="brand.700">{rs.criterionName}</Text>
                                  <Text fontSize="12px" fontWeight={600} color="brand.600">
                                    {rs.points}<Text as="span" color="brand.400" fontWeight={400}>/{rs.maxPoints}</Text>
                                  </Text>
                                </HStack>
                                {rs.feedback && <Text fontSize="11px" color="brand.500" lineHeight={1.5}>{rs.feedback}</Text>}
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      <Text fontSize="11px" color="brand.300" mt={3}>
                        Released {new Date(g.grade.releasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </CardBody>
                  </Card>
                </MotionBox>
              );
            })}
          </VStack>
        </MotionBox>
      )}
    </Box>
  );
}
