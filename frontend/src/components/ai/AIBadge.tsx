import { Badge, HStack, Icon, Text, Tooltip } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';

interface AIBadgeProps {
  variant?: 'badge' | 'dot' | 'banner';
  label?: string;
  overridden?: boolean;
  size?: 'sm' | 'md';
}

export default function AIBadge({ variant = 'badge', label = 'AI Suggestion', overridden = false, size = 'sm' }: AIBadgeProps) {
  if (variant === 'dot') {
    return (
      <Tooltip label={label}>
        <Icon as={Sparkles} boxSize={size === 'sm' ? 3 : 4} color={overridden ? 'brand.300' : 'ai.500'} />
      </Tooltip>
    );
  }

  return (
    <Badge
      bg={overridden ? 'brand.50' : 'ai.50'}
      color={overridden ? 'brand.400' : 'ai.600'}
      fontSize={size === 'sm' ? '2xs' : 'xs'}
      borderRadius="3px"
      px={1.5}
      textDecoration={overridden ? 'line-through' : 'none'}
    >
      <HStack spacing={1}>
        <Icon as={Sparkles} boxSize={size === 'sm' ? 2.5 : 3} />
        <Text>{label}</Text>
      </HStack>
    </Badge>
  );
}
