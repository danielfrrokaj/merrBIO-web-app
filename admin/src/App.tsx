import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Container, Heading, Button, extendTheme, Flex, Text, Avatar, Spacer } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './lib/supabase';
import AdminDashboard from './components/AdminDashboard';
import { Session } from '@supabase/supabase-js';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      'html, body': {
        height: '100%',
        margin: 0,
        padding: 0,
      },
      '#root': {
        height: '100%',
      },
    },
  },
});

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{full_name?: string, email?: string, avatar_url?: string} | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setAdminProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    // Get profile with role
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setIsAdmin(data?.role === 'admin');
    
    if (data?.role === 'admin') {
      setAdminProfile({
        full_name: data.full_name,
        email: session?.user?.email,
        avatar_url: data.avatar_url
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <ChakraProvider theme={theme}>
        <Flex 
          h="100vh" 
          w="100vw" 
          direction={{ base: "column", md: "row" }}
          overflow="hidden"
          m={0}
          p={0}
        >
          {/* Left side - Auth form */}
          <Flex 
            flex={{ base: "1", md: "1" }}
            width={{ base: "100%", md: "25%" }}
            alignItems="center" 
            justifyContent="center" 
            bg="gray.50"
            p={{ base: 4, md: 6 }}
            minWidth={{ md: "25%" }}
          >
            <Container maxW={{ base: "sm", md: "full" }} px={{ md: 4 }}>
              <Heading mb={6} size="lg" textAlign="center">hey admin</Heading>
              <Box p={6} bg="white" borderRadius="md" boxShadow="md">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  providers={[]}
                  view="sign_in"
                  showLinks={false}
                  redirectTo={window.location.origin}
                />
              </Box>
            </Container>
          </Flex>
          
          {/* Right side - Image - hidden on mobile */}
          <Box 
            display={{ base: "none", md: "block" }}
            flex={{ md: "3" }}
            width={{ md: "75%" }}
            minWidth={{ md: "75%" }}
            bgImage="url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkNt58V0xULfYYXs8-Azc0EW7NMaeOUbs4PQ&s')"
            bgSize="cover"
            bgPosition="center"
          >
            <Box 
              bg="rgba(0,0,0,0.4)" 
              h="100%" 
              w="100%" 
              p={8}
              display="flex"
              flexDirection="column"
              justifyContent="flex-end"
            >
              <Heading color="white" size="2xl" mb={3}>
                Trust the computer
              </Heading>
              <Text color="white" fontSize="lg" maxW="80%">
                The computer is your friend :)
              </Text>
            </Box>
          </Box>
        </Flex>
      </ChakraProvider>
    );
  }

  if (!isAdmin) {
    return (
      <ChakraProvider theme={theme}>
        <Box h="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
          <Container maxW="md" textAlign="center">
            <Heading mb={4}>Access Denied</Heading>
            <Text mb={4}>You do not have admin privileges.</Text>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </Container>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Flex direction="column" h="100vh">
          <Flex 
            as="header" 
            bg="white" 
            boxShadow="sm" 
            p={4} 
            alignItems="center"
          >
            <Heading size="md">Admin Dashboard</Heading>
            <Spacer />
            <Flex alignItems="center">
              {adminProfile && (
                <Flex mr={4} alignItems="center">
                  <Avatar 
                    size="sm" 
                    name={adminProfile.full_name} 
                    src={adminProfile.avatar_url} 
                    mr={2} 
                  />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">{adminProfile.full_name}</Text>
                    <Text fontSize="xs" color="gray.600">{adminProfile.email}</Text>
                  </Box>
                </Flex>
              )}
              <Button onClick={handleSignOut} size="sm">Sign Out</Button>
            </Flex>
          </Flex>
          <Box flex="1" bg="gray.50" overflowY="auto">
            <Routes>
              <Route path="/" element={<AdminDashboard adminProfile={adminProfile} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Flex>
      </Router>
    </ChakraProvider>
  );
}

export default App;
