import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    mono: `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`,
  },
  colors: {
    brand: {
      50: '#FAFAF9',
      100: '#F0EFED',
      200: '#E3E2DE',
      300: '#C4C3BF',
      400: '#9B9A97',
      500: '#73726E',
      600: '#55544F',
      700: '#37352F',
      800: '#25241F',
      900: '#191816',
    },
    ai: {
      50: '#F6F3FA',
      100: '#EBE1F6',
      200: '#D9C5EE',
      300: '#C6A6E5',
      400: '#B389DB',
      500: '#9B6BC6',
      600: '#7C54A0',
      700: '#5E3F79',
      800: '#3F2A52',
      900: '#21152B',
    },
    confirm: {
      50: '#ECFAEC',
      100: '#C6F0C6',
      500: '#2E8B57',
      600: '#246E46',
    },
    warning: {
      50: '#FFF8F0',
      100: '#FFE8CC',
      500: '#E87D24',
      600: '#C26A1E',
    },
    accent: {
      blue: '#2383E2',
      pink: '#D44C97',
      red: '#E03E3E',
      yellow: '#DFAB01',
      teal: '#0F7B6C',
    },
  },
  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.04)',
    card: '0 1px 3px rgba(0,0,0,0.04)',
    cardHover: '0 4px 16px rgba(0,0,0,0.08)',
    float: '0 8px 30px rgba(0,0,0,0.12)',
    sidebar: '1px 0 0 rgba(0,0,0,0.04)',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  styles: {
    global: {
      body: {
        bg: '#FFFFFF',
        color: 'brand.700',
        lineHeight: 1.6,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        bg: 'ai.100',
        color: 'ai.800',
      },
      '::-webkit-scrollbar': {
        width: '6px',
        height: '6px',
      },
      '::-webkit-scrollbar-track': {
        bg: 'transparent',
      },
      '::-webkit-scrollbar-thumb': {
        bg: 'brand.200',
        borderRadius: '3px',
        '&:hover': {
          bg: 'brand.300',
        },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '8px',
        fontWeight: 500,
        transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        _active: { transform: 'scale(0.98)' },
      },
      variants: {
        solid: {
          bg: 'brand.700',
          color: 'white',
          _hover: { bg: 'brand.800', transform: 'translateY(-1px)', shadow: 'sm' },
        },
        ai: {
          bg: 'ai.500',
          color: 'white',
          _hover: { bg: 'ai.600', transform: 'translateY(-1px)', shadow: 'sm' },
        },
        confirm: {
          bg: 'confirm.500',
          color: 'white',
          _hover: { bg: 'confirm.600', transform: 'translateY(-1px)', shadow: 'sm' },
        },
        ghost: {
          color: 'brand.500',
          _hover: { bg: 'brand.50', color: 'brand.700' },
        },
        outline: {
          borderColor: 'brand.200',
          color: 'brand.600',
          _hover: { bg: 'brand.50', borderColor: 'brand.300' },
        },
        subtle: {
          bg: 'brand.50',
          color: 'brand.600',
          _hover: { bg: 'brand.100', color: 'brand.700' },
        },
      },
      sizes: {
        sm: { h: '32px', fontSize: 'sm', px: 3 },
        md: { h: '38px', fontSize: 'sm', px: 4 },
        lg: { h: '44px', fontSize: 'md', px: 5 },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'brand.100',
          boxShadow: 'card',
          transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          overflow: 'hidden',
        },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'brand.100',
            color: 'brand.400',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            py: 3,
          },
          td: {
            borderColor: 'brand.50',
            py: '10px',
          },
          tr: {
            transition: 'background-color 0.15s ease',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: '6px',
        fontWeight: 500,
        fontSize: '11px',
        px: 2,
        py: '2px',
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'brand.200',
            borderRadius: '8px',
            _hover: { borderColor: 'brand.300' },
            _focus: { borderColor: 'ai.400', boxShadow: '0 0 0 1px var(--chakra-colors-ai-400)' },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          borderColor: 'brand.200',
          borderRadius: '8px',
          _hover: { borderColor: 'brand.300' },
          _focus: { borderColor: 'ai.400', boxShadow: '0 0 0 1px var(--chakra-colors-ai-400)' },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: '16px',
          boxShadow: 'float',
        },
        overlay: {
          bg: 'blackAlpha.400',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    Progress: {
      baseStyle: {
        track: {
          borderRadius: 'full',
        },
        filledTrack: {
          borderRadius: 'full',
          transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        },
      },
    },
    Skeleton: {
      baseStyle: {
        borderRadius: '8px',
      },
    },
    Divider: {
      baseStyle: {
        borderColor: 'brand.100',
        opacity: 1,
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: '10px',
        },
      },
    },
  },
});

export default theme;
