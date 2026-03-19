import { Button, Icon, useToast } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import api from '../../lib/api';

interface ConfirmGradeButtonProps {
  gradeId: string;
  allReviewed: boolean;
  submissionId: string;
}

export default function ConfirmGradeButton({ gradeId, allReviewed, submissionId }: ConfirmGradeButtonProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post(`/grades/${gradeId}/confirm`, { reviewStartedAt: Date.now() - 60000 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['grading-queue'] });
      toast({ title: 'Grade confirmed!', status: 'success', duration: 3000 });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to confirm', description: err.response?.data?.error, status: 'error', duration: 5000 });
    },
  });

  return (
    <Button
      bg="confirm.500"
      color="white"
      _hover={{ bg: 'confirm.600' }}
      size="md"
      w="full"
      leftIcon={<Icon as={Check} boxSize={4} />}
      onClick={() => mutation.mutate()}
      isLoading={mutation.isPending}
      isDisabled={!allReviewed}
    >
      {allReviewed ? 'Confirm Grade' : 'Review all criteria first'}
    </Button>
  );
}
