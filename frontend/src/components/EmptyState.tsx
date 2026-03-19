import { VStack, Text, Icon } from '@chakra-ui/react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <VStack py={12} spacing={3}>
      <Icon as={Inbox} boxSize={10} color="brand.200" />
      <Text fontSize="sm" color="brand.400">{message}</Text>
    </VStack>
  );
}
