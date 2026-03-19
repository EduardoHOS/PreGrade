import { useState } from 'react';
import {
  Box, Flex, VStack, Text, Button, Heading, Icon, useToast, HStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Sparkles, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const quickLogin = async (demoEmail: string, label: string) => {
    setLoading(label);
    try {
      await login(demoEmail, 'demo1234');
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Login failed', description: 'Make sure the database is seeded', status: 'error', duration: 3000 });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Flex h="100vh" align="center" justify="center" bg="brand.50" position="relative" overflow="hidden">
      {/* Subtle animated background orbs */}
      <MotionBox
        position="absolute"
        w="500px" h="500px"
        borderRadius="full"
        bg="ai.100"
        filter="blur(120px)"
        opacity={0.4}
        top="-100px" right="-100px"
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionBox
        position="absolute"
        w="400px" h="400px"
        borderRadius="full"
        bg="confirm.50"
        filter="blur(100px)"
        opacity={0.3}
        bottom="-80px" left="-80px"
        animate={{ scale: [1, 1.15, 1], x: [0, -15, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <MotionFlex
        direction="column"
        bg="white"
        borderRadius="16px"
        border="1px solid"
        borderColor="brand.100"
        shadow="float"
        p={10}
        w="440px"
        position="relative"
        zIndex={1}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <VStack spacing={3}>
              <Flex
                align="center"
                justify="center"
                w="48px" h="48px"
                borderRadius="14px"
                bg="ai.50"
                border="1px solid"
                borderColor="ai.100"
              >
                <Icon as={Sparkles} boxSize={5} color="ai.500" />
              </Flex>
              <VStack spacing={1}>
                <Heading size="lg" color="brand.700" fontWeight={700} letterSpacing="-0.02em">
                  PreGrade
                </Heading>
                <Text fontSize="sm" color="brand.400" fontWeight={400}>
                  AI-Powered Pre-Grading Demo
                </Text>
              </VStack>
            </VStack>
          </MotionBox>

          {/* Teacher button */}
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <Button
              size="lg"
              w="full"
              h="52px"
              bg="ai.500"
              color="white"
              _hover={{ bg: 'ai.600', transform: 'translateY(-2px)', shadow: 'lg' }}
              leftIcon={<Icon as={BookOpen} boxSize={5} />}
              onClick={() => quickLogin('teacher@pregrade.demo', 'teacher')}
              isLoading={loading === 'teacher'}
              loadingText="Entering..."
              borderRadius="12px"
              fontSize="md"
              fontWeight={600}
              transition="all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            >
              Enter as Teacher
            </Button>
          </MotionBox>

          {/* Divider */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <Flex align="center" gap={3}>
              <Box flex={1} h="1px" bg="brand.100" />
              <Text fontSize="xs" color="brand.400" fontWeight={500} textTransform="uppercase" letterSpacing="0.08em">
                or enter as student
              </Text>
              <Box flex={1} h="1px" bg="brand.100" />
            </Flex>
          </MotionBox>

          {/* Student buttons */}
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <HStack spacing={3} w="full">
              {[
                { name: 'Alice', email: 'alice@pregrade.demo' },
                { name: 'Bob', email: 'bob@pregrade.demo' },
                { name: 'Carol', email: 'carol@pregrade.demo' },
              ].map((s) => (
                <Button
                  key={s.name}
                  flex={1}
                  size="md"
                  h="48px"
                  variant="outline"
                  borderColor="brand.200"
                  color="brand.600"
                  _hover={{ bg: 'brand.50', borderColor: 'brand.300', transform: 'translateY(-1px)', shadow: 'sm' }}
                  leftIcon={<Icon as={GraduationCap} boxSize={4} />}
                  onClick={() => quickLogin(s.email, s.name)}
                  isLoading={loading === s.name}
                  loadingText={s.name}
                  borderRadius="12px"
                  fontSize="sm"
                  fontWeight={500}
                  transition="all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                >
                  {s.name}
                </Button>
              ))}
            </HStack>
          </MotionBox>
        </VStack>
      </MotionFlex>
    </Flex>
  );
}
