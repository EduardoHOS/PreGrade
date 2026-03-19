import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, Badge, Button, Skeleton,
  Table, Thead, Tbody, Tr, Th, Td, HStack, VStack, Icon,
  Card, CardBody,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

const MotionBox = motion(Box);
const MotionTr = motion(Tr as any);

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { colorScheme: string; label: string; bg?: string; color?: string }> = {
    ai_graded: { colorScheme: 'purple', label: 'AI Pre-Graded', bg: 'ai.50', color: 'ai.700' },
    partial: { colorScheme: 'orange', label: 'In Review', bg: 'warning.50', color: 'warning.600' },
    complete: { colorScheme: 'green', label: 'Confirmed', bg: 'confirm.50', color: 'confirm.600' },
    auto_graded: { colorScheme: 'blue', label: 'Auto-Graded' },
    pending_manual: { colorScheme: 'yellow', label: 'Needs Grading' },
    teacher_reviewed: { colorScheme: 'green', label: 'Reviewed', bg: 'confirm.50', color: 'confirm.600' },
  };
  const c = config[status?.toLowerCase()] || { colorScheme: 'gray', label: status || 'Pending' };
  return (
    <Badge
      bg={c.bg}
      color={c.color}
      colorScheme={!c.bg ? c.colorScheme : undefined}
      fontSize="11px"
      fontWeight={500}
      borderRadius="6px"
      px={2}
      py="2px"
    >
      {c.label}
    </Badge>
  );
}

function StatCard({ icon, iconColor, label, value, valueColor }: {
  icon: any; iconColor: string; label: string; value: number; valueColor?: string;
}) {
  return (
    <Card flex={1} _hover={{ shadow: 'cardHover', borderColor: 'brand.200' }}>
      <CardBody py={4} px={5}>
        <HStack spacing={3}>
          <Flex
            align="center" justify="center"
            w="36px" h="36px"
            borderRadius="10px"
            bg={`${iconColor.split('.')[0]}.50`}
          >
            <Icon as={icon} boxSize={4} color={iconColor} />
          </Flex>
          <Box>
            <Text fontSize="11px" color="brand.400" fontWeight={500} textTransform="uppercase" letterSpacing="0.04em">
              {label}
            </Text>
            <Text fontSize="xl" fontWeight={700} color={valueColor || 'brand.700'} lineHeight={1.2}>
              {value}
            </Text>
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
}

export default function GradingCenterPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['grading-queue'],
    queryFn: () => api.get('/grading/queue?statusFilter=all').then(r => r.data.data),
    refetchInterval: 5000,
  });

  const stats = data?.stats;
  const submissions = data?.submissions || [];

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <VStack align="start" spacing={1} mb={8}>
          <Heading size="md" color="brand.700" fontWeight={700} letterSpacing="-0.02em">
            Grading Center
          </Heading>
          <Text fontSize="sm" color="brand.400">
            Review AI pre-graded submissions
          </Text>
        </VStack>
      </MotionBox>

      {/* Stats */}
      {isLoading ? (
        <HStack spacing={4} mb={8}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} h="72px" flex={1} borderRadius="12px" />)}
        </HStack>
      ) : (
        <MotionBox
          initial="hidden" animate="show" variants={stagger}
          mb={8}
        >
          <HStack spacing={4}>
            <MotionBox variants={fadeUp} flex={1}>
              <StatCard icon={Sparkles} iconColor="ai.500" label="AI Pre-Graded" value={stats?.aiPreGraded ?? 0} valueColor="ai.600" />
            </MotionBox>
            <MotionBox variants={fadeUp} flex={1}>
              <StatCard icon={Clock} iconColor="brand.400" label="Pending" value={stats?.pending ?? 0} />
            </MotionBox>
            <MotionBox variants={fadeUp} flex={1}>
              <StatCard icon={CheckCircle} iconColor="confirm.500" label="Confirmed" value={stats?.confirmed ?? 0} valueColor="confirm.500" />
            </MotionBox>
            <MotionBox variants={fadeUp} flex={1}>
              <StatCard icon={AlertTriangle} iconColor="warning.500" label="Not Started" value={stats?.notStarted ?? 0} />
            </MotionBox>
          </HStack>
        </MotionBox>
      )}

      {/* Submissions table */}
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th w="8px" px={2}></Th>
                  <Th>Student</Th>
                  <Th>Assignment</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Submitted</Th>
                  <Th w="80px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => <Td key={j}><Skeleton h="14px" /></Td>)}
                    </Tr>
                  ))
                ) : submissions.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={12}>
                      <VStack spacing={2}>
                        <Icon as={CheckCircle} boxSize={8} color="brand.200" />
                        <Text color="brand.400" fontSize="sm">No submissions to review</Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  submissions.map((sub: any, idx: number) => (
                    <Tr
                      key={sub.id}
                      _hover={{ bg: 'brand.50' }}
                      cursor="pointer"
                      onClick={() => navigate(`/teacher/grading/review/${sub.id}`)}
                      role="group"
                    >
                      <Td px={2}>
                        <Box
                          w="6px" h="6px"
                          borderRadius="full"
                          bg={sub.priority === 'high' ? 'accent.red' : sub.priority === 'medium' ? 'warning.500' : 'confirm.500'}
                          transition="transform 0.15s ease"
                          _groupHover={{ transform: 'scale(1.3)' }}
                        />
                      </Td>
                      <Td>
                        <Text fontSize="13px" fontWeight={500} color="brand.700">{sub.user.firstName} {sub.user.lastName}</Text>
                        <Text fontSize="11px" color="brand.400">{sub.user.email}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="13px" color="brand.700">{sub.assignment.title}</Text>
                        <Text fontSize="11px" color="brand.400">{sub.assignment.course?.title}</Text>
                      </Td>
                      <Td>
                        <Badge
                          bg={sub.assignment.type === 'ESSAY' ? 'ai.50' : 'blue.50'}
                          color={sub.assignment.type === 'ESSAY' ? 'ai.700' : 'blue.700'}
                          fontSize="10px"
                          fontWeight={500}
                          borderRadius="4px"
                          textTransform="capitalize"
                        >
                          {sub.assignment.type?.toLowerCase() || 'essay'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1.5}>
                          <StatusBadge status={sub.grade?.status} />
                          {sub.grade?.aiFlags?.length > 0 && (
                            <Badge bg="red.50" color="accent.red" fontSize="10px" borderRadius="4px">
                              {sub.grade.aiFlags.length} flag(s)
                            </Badge>
                          )}
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="12px" color="brand.400">
                          {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </Td>
                      <Td>
                        <Text
                          fontSize="12px"
                          color="ai.500"
                          fontWeight={500}
                          opacity={0.6}
                          _groupHover={{ opacity: 1 }}
                          transition="opacity 0.15s ease"
                        >
                          Review →
                        </Text>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>
      </MotionBox>
    </Box>
  );
}
