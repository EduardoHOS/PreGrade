import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Flex, VStack, Text, Button, Avatar, Icon,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardCheck, BookOpen, GraduationCap, LogOut, Sparkles } from 'lucide-react';

const MotionBox = motion(Box);

const teacherNav = [
  { label: 'Grading Center', path: '/teacher/grading', icon: ClipboardCheck },
  { label: 'Gradebook', path: '/teacher/gradebook', icon: BookOpen },
];

const studentNav = [
  { label: 'My Grades', path: '/student/grades', icon: GraduationCap },
];

export default function DemoLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = user?.role === 'teacher' ? teacherNav : studentNav;

  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar */}
      <Flex
        direction="column"
        w="250px"
        bg="brand.50"
        borderRight="1px solid"
        borderColor="brand.100"
        px={3}
        py={4}
        flexShrink={0}
      >
        {/* Logo */}
        <Flex align="center" gap={2.5} mb={8} px={3} pt={1}>
          <Flex
            align="center"
            justify="center"
            w="28px" h="28px"
            borderRadius="8px"
            bg="ai.50"
            border="1px solid"
            borderColor="ai.100"
          >
            <Icon as={Sparkles} boxSize={3.5} color="ai.500" />
          </Flex>
          <Text fontSize="md" fontWeight={700} color="brand.700" letterSpacing="-0.01em">
            PreGrade
          </Text>
        </Flex>

        {/* Nav items */}
        <VStack spacing={0.5} align="stretch" flex={1}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Button
                key={item.path}
                variant="ghost"
                justifyContent="flex-start"
                leftIcon={<Icon as={item.icon} boxSize={4} strokeWidth={isActive ? 2.2 : 1.8} />}
                onClick={() => navigate(item.path)}
                bg={isActive ? 'white' : 'transparent'}
                color={isActive ? 'brand.700' : 'brand.500'}
                fontWeight={isActive ? 600 : 400}
                borderRadius="8px"
                size="sm"
                h="34px"
                px={3}
                shadow={isActive ? 'xs' : 'none'}
                _hover={{
                  bg: isActive ? 'white' : 'brand.100',
                  color: 'brand.700',
                }}
                transition="all 0.15s ease"
              >
                {item.label}
              </Button>
            );
          })}
        </VStack>

        {/* User section */}
        <Box borderTop="1px solid" borderColor="brand.100" pt={3} mt={3}>
          <Flex
            align="center"
            gap={2.5}
            px={3}
            py={2}
            borderRadius="10px"
            _hover={{ bg: 'brand.100' }}
            transition="background 0.15s ease"
            cursor="default"
          >
            <Avatar
              size="sm"
              name={`${user?.firstName} ${user?.lastName}`}
              bg="ai.500"
              color="white"
              fontSize="xs"
              fontWeight={600}
            />
            <Box flex={1} overflow="hidden">
              <Text fontSize="13px" fontWeight={500} noOfLines={1} color="brand.700">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text fontSize="11px" color="brand.400" noOfLines={1} textTransform="capitalize">
                {user?.role}
              </Text>
            </Box>
          </Flex>
          <Button
            variant="ghost"
            size="sm"
            w="full"
            leftIcon={<Icon as={LogOut} boxSize={3.5} />}
            onClick={() => { logout(); navigate('/login'); }}
            color="brand.400"
            justifyContent="flex-start"
            fontWeight={400}
            fontSize="13px"
            h="32px"
            px={3}
            mt={1}
            _hover={{ color: 'brand.700', bg: 'brand.100' }}
            transition="all 0.15s ease"
          >
            Sign out
          </Button>
        </Box>
      </Flex>

      {/* Main content */}
      <Box flex={1} overflow="auto" bg="white">
        <AnimatePresence mode="wait">
          <MotionBox
            key={location.pathname}
            maxW="1100px"
            mx="auto"
            px={10}
            py={8}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Outlet />
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Flex>
  );
}
