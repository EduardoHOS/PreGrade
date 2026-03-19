import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Card, Skeleton, Badge,
  Table, Thead, Tbody, Tr, Th, Td, Button, Icon, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, Alert, AlertIcon, Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Send, Undo2, Sparkles, CheckCircle } from 'lucide-react';
import api from '../lib/api';

const MotionBox = motion(Box);

export default function GradebookPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const { data: queueData } = useQuery({
    queryKey: ['grading-queue'],
    queryFn: () => api.get('/grading/queue?statusFilter=all').then(r => r.data.data),
  });

  const courseId = queueData?.submissions?.[0]?.assignment?.courseId;

  const { data: gradebook, isLoading } = useQuery({
    queryKey: ['gradebook', courseId],
    queryFn: () => api.get(`/gradebook/course/${courseId}`).then(r => r.data.data),
    enabled: !!courseId,
  });

  const { data: releaseStatus } = useQuery({
    queryKey: ['release-status', selectedAssignmentId],
    queryFn: () => api.get(`/grade-release/${selectedAssignmentId}/status`).then(r => r.data.data),
    enabled: !!selectedAssignmentId && isOpen,
  });

  const releaseMutation = useMutation({
    mutationFn: (assignmentId: string) => api.post(`/grade-release/${assignmentId}/release`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradebook'] });
      queryClient.invalidateQueries({ queryKey: ['release-status'] });
      toast({ title: 'Grades released!', status: 'success', duration: 3000 });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: 'Release failed', description: err.response?.data?.error, status: 'error', duration: 5000 });
    },
  });

  const recallMutation = useMutation({
    mutationFn: (assignmentId: string) => api.post(`/grade-release/${assignmentId}/recall`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradebook'] });
      toast({ title: 'Release recalled', status: 'info', duration: 3000 });
    },
  });

  if (isLoading || !gradebook) {
    return (
      <Box>
        <Skeleton h="36px" w="200px" mb={2} />
        <Skeleton h="16px" w="300px" mb={8} />
        <Skeleton h="300px" borderRadius="12px" />
      </Box>
    );
  }

  const assignments = gradebook.assignments || [];
  const grid = gradebook.grid || [];

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <VStack align="start" spacing={1} mb={8}>
          <Heading size="md" color="brand.700" fontWeight={700} letterSpacing="-0.02em">
            Gradebook
          </Heading>
          <Text fontSize="sm" color="brand.400">{gradebook.course?.title}</Text>
        </VStack>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <Card>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th position="sticky" left={0} bg="white" zIndex={1} minW="180px">Student</Th>
                  {assignments.map((a: any) => (
                    <Th key={a.id} textAlign="center" minW="150px">
                      <VStack spacing={1}>
                        <Text fontSize="11px" noOfLines={1} fontWeight={600}>{a.title}</Text>
                        <Text fontSize="10px" color="brand.300" fontWeight={400} textTransform="none" letterSpacing="normal">
                          {a.maxPoints} pts
                        </Text>
                        {a.gradesReleasedAt ? (
                          <HStack spacing={1.5}>
                            <Badge bg="confirm.50" color="confirm.600" fontSize="10px" borderRadius="4px">
                              Released
                            </Badge>
                            <Button
                              size="xs" variant="ghost" h="20px" minW="20px" p={0}
                              onClick={(e) => { e.stopPropagation(); recallMutation.mutate(a.id); }}
                              isLoading={recallMutation.isPending}
                              color="brand.400"
                              _hover={{ color: 'brand.700', bg: 'brand.50' }}
                            >
                              <Icon as={Undo2} boxSize={3} />
                            </Button>
                          </HStack>
                        ) : (
                          <Button
                            size="xs" h="24px"
                            bg="accent.blue" color="white"
                            _hover={{ bg: '#1a6fc2', transform: 'translateY(-1px)' }}
                            borderRadius="6px"
                            fontSize="10px"
                            fontWeight={500}
                            leftIcon={<Icon as={Send} boxSize={3} />}
                            onClick={(e) => { e.stopPropagation(); setSelectedAssignmentId(a.id); onOpen(); }}
                            transition="all 0.2s ease"
                          >
                            Release
                          </Button>
                        )}
                      </VStack>
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {grid.map((row: any) => (
                  <Tr key={row.student.id} _hover={{ bg: 'brand.50' }}>
                    <Td position="sticky" left={0} bg="white" zIndex={1}>
                      <Text fontSize="13px" fontWeight={500} color="brand.700">
                        {row.student.firstName} {row.student.lastName}
                      </Text>
                    </Td>
                    {row.grades.map((g: any) => (
                      <Td key={g.assignmentId} textAlign="center">
                        {g.points !== null ? (
                          <VStack spacing={0.5}>
                            <Text fontSize="13px" fontWeight={600} color="brand.700">
                              {g.points}<Text as="span" color="brand.400" fontWeight={400}>/{g.maxPoints}</Text>
                            </Text>
                            <HStack spacing={1}>
                              {g.isAiGraded && <Icon as={Sparkles} boxSize={3} color="ai.400" />}
                              {g.isConfirmed && <Icon as={CheckCircle} boxSize={3} color="confirm.500" />}
                            </HStack>
                          </VStack>
                        ) : (
                          <Text fontSize="12px" color="brand.300">
                            {g.status === 'missing' ? '--' : g.status}
                          </Text>
                        )}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      </MotionBox>

      {/* Release Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader fontSize="md" fontWeight={600} pb={2}>Release Grades</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {releaseStatus ? (
              <VStack spacing={4} align="stretch">
                <HStack spacing={6}>
                  {[
                    { label: 'Enrolled', value: releaseStatus.totalEnrolled },
                    { label: 'Submitted', value: releaseStatus.submittedCount },
                    { label: 'Confirmed', value: releaseStatus.confirmedCount, color: 'confirm.500' },
                  ].map((s) => (
                    <Box key={s.label}>
                      <Text fontSize="10px" color="brand.400" fontWeight={500} textTransform="uppercase" letterSpacing="0.05em">
                        {s.label}
                      </Text>
                      <Text fontSize="xl" fontWeight={700} color={s.color || 'brand.700'}>
                        {s.value}
                      </Text>
                    </Box>
                  ))}
                </HStack>
                {releaseStatus.averagePoints !== null && (
                  <Box bg="brand.50" borderRadius="8px" px={3} py={2}>
                    <Text fontSize="sm" color="brand.500">
                      Average: <b>{releaseStatus.averagePoints} pts</b> | Range: {releaseStatus.lowestPoints}--{releaseStatus.highestPoints}
                    </Text>
                  </Box>
                )}
                {releaseStatus.unconfirmedStudents?.length > 0 && (
                  <Alert status="warning" fontSize="xs" borderRadius="10px" py={2}>
                    <AlertIcon />
                    {releaseStatus.unconfirmedStudents.length} grade(s) not yet confirmed
                  </Alert>
                )}
                {releaseStatus.alreadyReleased && (
                  <Alert status="info" fontSize="xs" borderRadius="10px" py={2}>
                    <AlertIcon />Grades already released
                  </Alert>
                )}
              </VStack>
            ) : (
              <Skeleton h="100px" borderRadius="8px" />
            )}
          </ModalBody>
          <ModalFooter pt={4}>
            <Button variant="ghost" mr={3} onClick={onClose} size="sm">Cancel</Button>
            <Button
              bg="accent.blue"
              color="white"
              _hover={{ bg: '#1a6fc2' }}
              size="sm"
              borderRadius="8px"
              onClick={() => selectedAssignmentId && releaseMutation.mutate(selectedAssignmentId)}
              isLoading={releaseMutation.isPending}
              isDisabled={!releaseStatus || releaseStatus.alreadyReleased || releaseStatus.unconfirmedStudents?.length > 0}
            >
              Release to Students
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
