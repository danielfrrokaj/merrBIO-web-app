import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Flex,
  Stack,
  Switch,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  HStack,
  Text,
  Badge,
  Container,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  SimpleGrid,
  Icon,
  TableContainer,
  Progress,
  Divider,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { supabaseAdmin } from '../lib/supabase';
import { FaUser, FaStore, FaShoppingBasket, FaShoppingCart, FaClipboardList, FaLeaf, FaMoneyBillWave, FaTruck, FaPercentage } from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_banned: boolean;
}

interface Farm {
  id: string;
  name: string;
  owner_id: string;
  location: string;
  description?: string;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  farm_id: string;
  price: number;
  available: boolean;
  description?: string;
  image_url?: string;
}

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
}

interface AdminDashboardProps {
  adminProfile?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

// Empty form states
const emptyFarm: Omit<Farm, 'id'> = {
  name: '',
  owner_id: '',
  location: '',
  description: '',
  image_url: '',
};

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  farm_id: '',
  price: 0,
  available: true,
  description: '',
  image_url: '',
};

const emptyOrder: Omit<Order, 'id'> = {
  user_id: '',
  product_id: '',
  quantity: 1,
  total_price: 0,
  status: 'pending',
};

const emptyUser: Omit<User, 'id'> = {
  email: '',
  full_name: '',
  role: 'user',
  is_banned: false
};

export default function AdminDashboard({ adminProfile }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Form states
  const [farmForm, setFarmForm] = useState<Omit<Farm, 'id'>>(emptyFarm);
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [orderForm, setOrderForm] = useState<Omit<Order, 'id'>>(emptyOrder);
  const [userForm, setUserForm] = useState<Omit<User, 'id'>>(emptyUser);
  
  // Edit state tracking
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Modal controls
  const farmModal = useDisclosure();
  const productModal = useDisclosure();
  const orderModal = useDisclosure();
  const userModal = useDisclosure();
  const deleteConfirmModal = useDisclosure();

  // Ref for item to delete
  const itemToDelete = useRef<{type: 'farm' | 'product' | 'order' | 'user', id: string} | null>(null);
  
  const toast = useToast();

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    userGrowth: 5, // Placeholder, would come from real data
    salesGrowth: 12, // Placeholder, would come from real data
    topSellingProducts: [] as {id: string, name: string, count: number}[],
    ordersByStatus: {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Calculate analytics when orders or products change
    if (orders.length > 0 || products.length > 0) {
      calculateAnalytics();
    }
  }, [orders, products, users]);

  const calculateAnalytics = () => {
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
    
    // Calculate average order value
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Calculate orders by status
    const ordersByStatus = {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };

    // Find top selling products using a Map instead of a plain object
    const productCountsMap = new Map<string, number>();
    
    // Count product quantities from orders
    orders.forEach(order => {
      const currentCount = productCountsMap.get(order.product_id) || 0;
      productCountsMap.set(order.product_id, currentCount + order.quantity);
    });
    
    // Convert to array for sorting
    const productCountsArray = Array.from(productCountsMap.entries())
      .map(([id, count]) => {
        const product = products.find(p => p.id === id);
        return {
          id,
          name: product ? product.name : 'Unknown Product',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setAnalytics({
      totalRevenue,
      averageOrderValue,
      userGrowth: analytics.userGrowth,
      salesGrowth: analytics.salesGrowth,
      topSellingProducts: productCountsArray,
      ordersByStatus
    });
  };

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData } = await supabaseAdmin
        .from('profiles')
        .select('*');
      setUsers(usersData || []);

      // Fetch farms
      const { data: farmsData } = await supabaseAdmin
        .from('farms')
        .select('*');
      setFarms(farmsData || []);

      // Fetch products
      const { data: productsData } = await supabaseAdmin
        .from('products')
        .select('*');
      setProducts(productsData || []);

      // Fetch orders
      const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select('*');
      setOrders(ordersData || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching data',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      toast({
        title: 'User role updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error updating user role',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // User CRUD operations
  const handleSaveUser = async () => {
    try {
      if (editingUserId) {
        // Update existing user
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name: userForm.full_name,
            role: userForm.role
          })
          .eq('id', editingUserId);
        
        toast({
          title: 'User updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // For new users, we'd need to create auth user first, then profile
        // This typically requires server-side code or Supabase Edge Functions
        // with proper permissions, as client-side can't directly create users
        toast({
          title: 'Creating new users requires server integration',
          description: 'This feature would need a server-side function to create auth users.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        // Placeholder for actual implementation
        // const { data, error } = await supabaseAdmin.auth.admin.createUser({
        //   email: userForm.email,
        //   password: generateTemporaryPassword(),
        //   user_metadata: { full_name: userForm.full_name }
        // });
        // ...
      }
      
      // Reset form and refresh data
      setUserForm(emptyUser);
      setEditingUserId(null);
      userModal.onClose();
      fetchData();
    } catch (error: any) {
      toast({
        title: `Error ${editingUserId ? 'updating' : 'creating'} user`,
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditUser = (user: User) => {
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_banned: user.is_banned || false
    });
    setEditingUserId(user.id);
    userModal.onOpen();
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      // In a real implementation, this would disable the user's auth account
      // For now, we'll just update a hypothetical 'is_banned' field in profiles
      await supabaseAdmin
        .from('profiles')
        .update({ is_banned: !isBanned })
        .eq('id', userId);
      
      toast({
        title: isBanned ? 'User unbanned' : 'User banned',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: `Error ${isBanned ? 'unbanning' : 'banning'} user`,
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Farm CRUD operations
  const handleSaveFarm = async () => {
    try {
      if (editingFarmId) {
        // Update existing farm
        await supabaseAdmin
          .from('farms')
          .update(farmForm)
          .eq('id', editingFarmId);
        
        toast({
          title: 'Farm updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new farm
        await supabaseAdmin
          .from('farms')
          .insert([farmForm]);
        
        toast({
          title: 'Farm created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Reset form and refresh data
      setFarmForm(emptyFarm);
      setEditingFarmId(null);
      farmModal.onClose();
      fetchData();
    } catch (error: any) {
      toast({
        title: `Error ${editingFarmId ? 'updating' : 'creating'} farm`,
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditFarm = (farm: Farm) => {
    setFarmForm({
      name: farm.name,
      owner_id: farm.owner_id,
      location: farm.location,
      description: farm.description || '',
      image_url: farm.image_url || '',
    });
    setEditingFarmId(farm.id);
    farmModal.onOpen();
  };

  // Product CRUD operations
  const handleSaveProduct = async () => {
    try {
      if (editingProductId) {
        // Update existing product
        await supabaseAdmin
          .from('products')
          .update(productForm)
          .eq('id', editingProductId);
        
        toast({
          title: 'Product updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new product
        await supabaseAdmin
          .from('products')
          .insert([productForm]);
        
        toast({
          title: 'Product created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Reset form and refresh data
      setProductForm(emptyProduct);
      setEditingProductId(null);
      productModal.onClose();
      fetchData();
    } catch (error: any) {
      toast({
        title: `Error ${editingProductId ? 'updating' : 'creating'} product`,
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      farm_id: product.farm_id,
      price: product.price,
      available: product.available,
      description: product.description || '',
      image_url: product.image_url || '',
    });
    setEditingProductId(product.id);
    productModal.onOpen();
  };

  // Order CRUD operations
  const handleSaveOrder = async () => {
    try {
      if (editingOrderId) {
        // Update existing order
        await supabaseAdmin
          .from('orders')
          .update(orderForm)
          .eq('id', editingOrderId);
        
        toast({
          title: 'Order updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new order
        await supabaseAdmin
          .from('orders')
          .insert([orderForm]);
        
        toast({
          title: 'Order created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Reset form and refresh data
      setOrderForm(emptyOrder);
      setEditingOrderId(null);
      orderModal.onClose();
      fetchData();
    } catch (error: any) {
      toast({
        title: `Error ${editingOrderId ? 'updating' : 'creating'} order`,
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditOrder = (order: Order) => {
    setOrderForm({
      user_id: order.user_id,
      product_id: order.product_id,
      quantity: order.quantity,
      total_price: order.total_price,
      status: order.status,
    });
    setEditingOrderId(order.id);
    orderModal.onOpen();
  };

  // Delete operations
  const confirmDelete = (type: 'farm' | 'product' | 'order' | 'user', id: string) => {
    itemToDelete.current = { type, id };
    deleteConfirmModal.onOpen();
  };

  const handleDelete = async () => {
    if (!itemToDelete.current) return;
    
    try {
      const { type, id } = itemToDelete.current;
      
      await supabaseAdmin
        .from(type + 's') // farms, products, orders
        .delete()
        .eq('id', id);
      
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      deleteConfirmModal.onClose();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error deleting item',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'confirmed': return 'blue';
      case 'shipped': return 'purple';
      case 'delivered': return 'green';
      default: return 'gray';
    }
  };

  // Color scheme
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const statCardColors = [
    { bg: "teal.50", icon: "teal.500" },
    { bg: "blue.50", icon: "blue.500" },
    { bg: "purple.50", icon: "purple.500" },
    { bg: "orange.50", icon: "orange.500" }
  ];
  const tabHoverBg = useColorModeValue("green.50", "green.900");

  return (
    <Flex direction="column" width="100%" height="100%" minHeight="100vh" p={0} overflow="auto" bg={bgColor}>
      {/* Top Analytics Section */}
      <Box p={4} width="100%">
        <Heading size="lg" mb={4}>Analytics Dashboard</Heading>
        
        {/* Stats Section with soft colors */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={4}>
          <Card bg={statCardColors[0].bg} shadow="md" borderRadius="lg">
            <CardBody>
              <Flex align="center">
                <Icon as={FaUser} boxSize={10} color={statCardColors[0].icon} mr={4} />
                <Stat>
                  <StatLabel color="gray.600">Total Users</StatLabel>
                  <StatNumber>{users.length}</StatNumber>
                  <Text fontSize="sm" color="gray.600">
                    {users.filter(u => u.role === 'admin').length} admins
                  </Text>
                </Stat>
              </Flex>
            </CardBody>
          </Card>
          <Card bg={statCardColors[1].bg} shadow="md" borderRadius="lg">
            <CardBody>
              <Flex align="center">
                <Icon as={FaLeaf} boxSize={10} color={statCardColors[1].icon} mr={4} />
                <Stat>
                  <StatLabel color="gray.600">Farms</StatLabel>
                  <StatNumber>{farms.length}</StatNumber>
                  <Text fontSize="sm" color="gray.600">Registered farms</Text>
                </Stat>
              </Flex>
            </CardBody>
          </Card>
          <Card bg={statCardColors[2].bg} shadow="md" borderRadius="lg">
            <CardBody>
              <Flex align="center">
                <Icon as={FaShoppingBasket} boxSize={10} color={statCardColors[2].icon} mr={4} />
                <Stat>
                  <StatLabel color="gray.600">Products</StatLabel>
                  <StatNumber>{products.length}</StatNumber>
                  <Text fontSize="sm" color="gray.600">
                    {products.filter(p => p.available).length} available
                  </Text>
                </Stat>
              </Flex>
            </CardBody>
          </Card>
          <Card bg={statCardColors[3].bg} shadow="md" borderRadius="lg">
            <CardBody>
              <Flex align="center">
                <Icon as={FaShoppingCart} boxSize={10} color={statCardColors[3].icon} mr={4} />
                <Stat>
                  <StatLabel color="gray.600">Orders</StatLabel>
                  <StatNumber>{orders.length}</StatNumber>
                  <Text fontSize="sm" color="gray.600">
                    {orders.filter(o => o.status === 'pending').length} pending
                  </Text>
                </Stat>
              </Flex>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          {/* Order Status Section */}
          <Card bg={cardBg} shadow="md" borderRadius="lg" p={2}>
            <CardHeader pb={0}>
              <Heading size="md">Order Status</Heading>
            </CardHeader>
            <CardBody>
              <Stack spacing={3}>
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.500">Pending</Text>
                    <Text fontSize="sm" fontWeight="bold">{analytics.ordersByStatus.pending}</Text>
                  </Flex>
                  <Progress value={analytics.ordersByStatus.pending} max={orders.length} size="sm" colorScheme="yellow" borderRadius="full" />
                </Box>
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.500">Confirmed</Text>
                    <Text fontSize="sm" fontWeight="bold">{analytics.ordersByStatus.confirmed}</Text>
                  </Flex>
                  <Progress value={analytics.ordersByStatus.confirmed} max={orders.length} size="sm" colorScheme="blue" borderRadius="full" />
                </Box>
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.500">Shipped</Text>
                    <Text fontSize="sm" fontWeight="bold">{analytics.ordersByStatus.shipped}</Text>
                  </Flex>
                  <Progress value={analytics.ordersByStatus.shipped} max={orders.length} size="sm" colorScheme="purple" borderRadius="full" />
                </Box>
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.500">Delivered</Text>
                    <Text fontSize="sm" fontWeight="bold">{analytics.ordersByStatus.delivered}</Text>
                  </Flex>
                  <Progress value={analytics.ordersByStatus.delivered} max={orders.length} size="sm" colorScheme="green" borderRadius="full" />
                </Box>
              </Stack>
            </CardBody>
          </Card>

          {/* Top Products */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <Heading size="md">Top Selling Products</Heading>
            </CardHeader>
            <CardBody>
              {analytics.topSellingProducts.length > 0 ? (
                <Stack spacing={3}>
                  {analytics.topSellingProducts.map((product, index) => (
                    <Box key={product.id}>
                      <Flex justify="space-between" mb={1}>
                        <Tooltip label={product.name} placement="top">
                          <Text fontSize="sm" noOfLines={1}>{product.name}</Text>
                        </Tooltip>
                        <Text fontSize="sm" fontWeight="bold">{product.count} sold</Text>
                      </Flex>
                      <Progress 
                        value={product.count} 
                        max={analytics.topSellingProducts[0].count} 
                        size="sm" 
                        colorScheme={index === 0 ? "green" : index === 1 ? "blue" : index === 2 ? "purple" : "teal"} 
                        borderRadius="full" 
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Text color="gray.500">No sales data available</Text>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>

      {/* Main Content Area with Fixed Size */}
      <Card mx={4} mb={4} flexGrow={1} width="calc(100% - 2rem)" bg={cardBg} shadow="md" borderRadius="lg">
        <CardBody p={0} height="100%">
          <Flex direction="column" width="100%" height="100%">
            <Tabs 
              size="lg" 
              variant="enclosed" 
              colorScheme="green" 
              display="flex" 
              flexDirection="column" 
              width="100%" 
              height="100%"
              isLazy
            >
              <TabList width="100%">
                <Tab _hover={{ bg: tabHoverBg }}>
                  <Icon as={FaUser} mr={2} />
                  Users
                </Tab>
                <Tab _hover={{ bg: tabHoverBg }}>
                  <Icon as={FaLeaf} mr={2} />
                  Farms
                </Tab>
                <Tab _hover={{ bg: tabHoverBg }}>
                  <Icon as={FaShoppingBasket} mr={2} />
                  Products
                </Tab>
                <Tab _hover={{ bg: tabHoverBg }}>
                  <Icon as={FaClipboardList} mr={2} />
                  Orders
                </Tab>
              </TabList>

              {/* Fixed size container for all tab panels */}
              <TabPanels flex="1" minHeight="500px" height="auto" maxHeight="calc(100vh - 240px)" overflow="visible" width="100%">
                <TabPanel height="100%" p={4} width="100%" display="flex" flexDirection="column">
                  <Flex justifyContent="space-between" alignItems="center" mb={4} width="100%">
                    <Heading size="md">Users Management</Heading>
                    <Button colorScheme="green" onClick={() => {
                      setUserForm(emptyUser);
                      setEditingUserId(null);
                      userModal.onOpen();
                    }}>
                      Add User
                    </Button>
                  </Flex>
                  <TableContainer 
                    width="100%" 
                    height="100%"
                    overflowY="auto" 
                    overflowX="auto" 
                    flex="1"
                    borderWidth="1px" 
                    borderRadius="lg" 
                    borderColor="gray.200"
                    bg={cardBg}
                  >
                    <Table variant="simple" width="100%" size="md" layout="fixed">
                      <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                        <Tr>
                          <Th width="25%">Email</Th>
                          <Th width="25%">Name</Th>
                          <Th width="10%">Role</Th>
                          <Th width="40%">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {users.map((user) => (
                          <Tr key={user.id}>
                            <Td>{user.email}</Td>
                            <Td>{user.full_name}</Td>
                            <Td>{user.role}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  colorScheme={user.role === 'admin' ? 'red' : 'green'}
                                  onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                >
                                  {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditUser(user)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="orange"
                                  onClick={() => handleBanUser(user.id, user.is_banned)}
                                >
                                  {user.is_banned ? 'Unban' : 'Ban'}
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => confirmDelete('user', user.id)}
                                >
                                  Delete
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                <TabPanel height="100%" p={4} width="100%" display="flex" flexDirection="column">
                  <Flex justifyContent="space-between" alignItems="center" mb={4} width="100%">
                    <Heading size="md">Farms Management</Heading>
                    <Button colorScheme="green" onClick={() => {
                      setFarmForm(emptyFarm);
                      setEditingFarmId(null);
                      farmModal.onOpen();
                    }}>
                      Add Farm
                    </Button>
                  </Flex>
                  <TableContainer 
                    width="100%" 
                    height="100%"
                    overflowY="auto" 
                    overflowX="auto" 
                    flex="1"
                    borderWidth="1px" 
                    borderRadius="lg" 
                    borderColor="gray.200"
                  >
                    <Table variant="simple" width="100%" size="md" layout="fixed">
                      <Thead position="sticky" top={0} bg="white" zIndex={1}>
                        <Tr>
                          <Th width="25%">Name</Th>
                          <Th width="25%">Location</Th>
                          <Th width="15%">Products</Th>
                          <Th width="20%">Owner</Th>
                          <Th width="15%">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {farms.map((farm) => {
                          // Find the owner user object
                          const owner = users.find(user => user.id === farm.owner_id);
                          // Count products for this farm
                          const farmProducts = products.filter(product => product.farm_id === farm.id);
                          const productCount = farmProducts.length;
                          const availableProductCount = farmProducts.filter(p => p.available).length;
                          
                          return (
                            <Tr key={farm.id}>
                              <Td>{farm.name}</Td>
                              <Td>{farm.location}</Td>
                              <Td>
                                <Text fontWeight="bold">
                                  {productCount}
                                  {productCount > 0 && (
                                    <Text as="span" fontSize="sm" color="gray.500" display="block">
                                      {availableProductCount} available
                                    </Text>
                                  )}
                                </Text>
                              </Td>
                              <Td>
                                {owner ? (
                                  <Text>
                                    {owner.full_name}
                                    <Text as="span" fontSize="sm" color="gray.500" ml={1}>
                                      ({farm.owner_id.substring(0, 6)}...)
                                    </Text>
                                  </Text>
                                ) : (
                                  farm.owner_id
                                )}
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Button size="sm" colorScheme="blue" onClick={() => handleEditFarm(farm)}>
                                    Edit
                                  </Button>
                                  <Button size="sm" colorScheme="red" onClick={() => confirmDelete('farm', farm.id)}>
                                    Delete
                                  </Button>
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                <TabPanel height="100%" p={4} width="100%" display="flex" flexDirection="column">
                  <Flex justifyContent="space-between" alignItems="center" mb={4} width="100%">
                    <Heading size="md">Products Management</Heading>
                    <Button colorScheme="green" onClick={() => {
                      setProductForm(emptyProduct);
                      setEditingProductId(null);
                      productModal.onOpen();
                    }}>
                      Add Product
                    </Button>
                  </Flex>
                  <TableContainer 
                    width="100%" 
                    height="100%"
                    overflowY="auto" 
                    overflowX="auto" 
                    flex="1"
                    borderWidth="1px" 
                    borderRadius="lg" 
                    borderColor="gray.200"
                  >
                    <Table variant="simple" width="100%" size="md" layout="fixed">
                      <Thead position="sticky" top={0} bg="white" zIndex={1}>
                        <Tr>
                          <Th width="25%">Name</Th>
                          <Th width="25%">Farm</Th>
                          <Th width="15%">Price</Th>
                          <Th width="15%">Available</Th>
                          <Th width="20%">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {products.map((product) => {
                          // Find the farm and owner information
                          const farm = farms.find(f => f.id === product.farm_id);
                          const owner = farm ? users.find(user => user.id === farm.owner_id) : null;
                          
                          return (
                            <Tr key={product.id}>
                              <Td>{product.name}</Td>
                              <Td>
                                {farm ? (
                                  <Text>
                                    {farm.name}
                                    {owner && (
                                      <Text as="span" fontSize="sm" color="gray.500" display="block">
                                        Owner: {owner.full_name}
                                      </Text>
                                    )}
                                  </Text>
                                ) : (
                                  product.farm_id
                                )}
                              </Td>
                              <Td>${product.price}</Td>
                              <Td>
                                <Badge colorScheme={product.available ? 'green' : 'red'}>
                                  {product.available ? 'Yes' : 'No'}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Button size="sm" colorScheme="blue" onClick={() => handleEditProduct(product)}>
                                    Edit
                                  </Button>
                                  <Button size="sm" colorScheme="red" onClick={() => confirmDelete('product', product.id)}>
                                    Delete
                                  </Button>
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                <TabPanel height="100%" p={4} width="100%" display="flex" flexDirection="column">
                  <Flex justifyContent="space-between" alignItems="center" mb={4} width="100%">
                    <Heading size="md">Orders Management</Heading>
                    <Button colorScheme="green" onClick={() => {
                      setOrderForm(emptyOrder);
                      setEditingOrderId(null);
                      orderModal.onOpen();
                    }}>
                      Add Order
                    </Button>
                  </Flex>
                  <TableContainer 
                    width="100%" 
                    height="100%"
                    overflowY="auto" 
                    overflowX="auto" 
                    flex="1"
                    borderWidth="1px" 
                    borderRadius="lg" 
                    borderColor="gray.200"
                  >
                    <Table variant="simple" width="100%" size="md" layout="fixed">
                      <Thead position="sticky" top={0} bg="white" zIndex={1}>
                        <Tr>
                          <Th width="20%">User</Th>
                          <Th width="20%">Product</Th>
                          <Th width="10%">Quantity</Th>
                          <Th width="15%">Total Price</Th>
                          <Th width="15%">Status</Th>
                          <Th width="20%">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {orders.map((order) => {
                          // Find the user and product associated with this order
                          const user = users.find(u => u.id === order.user_id);
                          const product = products.find(p => p.id === order.product_id);
                          
                          return (
                            <Tr key={order.id}>
                              <Td>
                                {user ? (
                                  <Text>
                                    {user.full_name}
                                    <Text as="span" fontSize="sm" color="gray.500" display="block">
                                      {user.email}
                                    </Text>
                                  </Text>
                                ) : (
                                  order.user_id
                                )}
                              </Td>
                              <Td>
                                {product ? (
                                  <Text>
                                    {product.name}
                                    <Text as="span" fontSize="sm" color="gray.500" display="block">
                                      ${product.price}
                                    </Text>
                                  </Text>
                                ) : (
                                  order.product_id
                                )}
                              </Td>
                              <Td>{order.quantity}</Td>
                              <Td>${order.total_price}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Button size="sm" colorScheme="blue" onClick={() => handleEditOrder(order)}>
                                    Edit
                                  </Button>
                                  <Button size="sm" colorScheme="red" onClick={() => confirmDelete('order', order.id)}>
                                    Delete
                                  </Button>
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Flex>
        </CardBody>
      </Card>

      {/* Farm Form Modal */}
      <Modal isOpen={farmModal.isOpen} onClose={farmModal.onClose} scrollBehavior="outside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingFarmId ? 'Edit Farm' : 'Add Farm'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input 
                  value={farmForm.name} 
                  onChange={(e) => setFarmForm({...farmForm, name: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Owner</FormLabel>
                <Select 
                  placeholder="Select owner" 
                  value={farmForm.owner_id}
                  onChange={(e) => setFarmForm({...farmForm, owner_id: e.target.value})}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input 
                  value={farmForm.location} 
                  onChange={(e) => setFarmForm({...farmForm, location: e.target.value})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input 
                  value={farmForm.description} 
                  onChange={(e) => setFarmForm({...farmForm, description: e.target.value})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Image URL</FormLabel>
                <Input 
                  value={farmForm.image_url} 
                  onChange={(e) => setFarmForm({...farmForm, image_url: e.target.value})}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={farmModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveFarm}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Product Form Modal */}
      <Modal isOpen={productModal.isOpen} onClose={productModal.onClose} scrollBehavior="outside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingProductId ? 'Edit Product' : 'Add Product'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input 
                  value={productForm.name} 
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Farm</FormLabel>
                <Select 
                  placeholder="Select farm" 
                  value={productForm.farm_id}
                  onChange={(e) => setProductForm({...productForm, farm_id: e.target.value})}
                >
                  {farms.map(farm => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Price</FormLabel>
                <NumberInput 
                  min={0} 
                  precision={2} 
                  value={productForm.price}
                  onChange={(value) => setProductForm({...productForm, price: parseFloat(value)})}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel>Available</FormLabel>
                <Switch 
                  isChecked={productForm.available} 
                  onChange={(e) => setProductForm({...productForm, available: e.target.checked})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input 
                  value={productForm.description} 
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Image URL</FormLabel>
                <Input 
                  value={productForm.image_url} 
                  onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={productModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveProduct}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Order Form Modal */}
      <Modal isOpen={orderModal.isOpen} onClose={orderModal.onClose} scrollBehavior="outside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingOrderId ? 'Edit Order' : 'Add Order'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>User</FormLabel>
                <Select 
                  placeholder="Select user" 
                  value={orderForm.user_id}
                  onChange={(e) => setOrderForm({...orderForm, user_id: e.target.value})}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Product</FormLabel>
                <Select 
                  placeholder="Select product" 
                  value={orderForm.product_id}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    const price = product ? product.price : 0;
                    const quantity = orderForm.quantity;
                    
                    setOrderForm({
                      ...orderForm, 
                      product_id: e.target.value,
                      total_price: price * quantity
                    });
                  }}
                >
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name} - ${product.price}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Quantity</FormLabel>
                <NumberInput 
                  min={1} 
                  value={orderForm.quantity}
                  onChange={(value) => {
                    const quantity = parseInt(value);
                    const product = products.find(p => p.id === orderForm.product_id);
                    const price = product ? product.price : 0;
                    
                    setOrderForm({
                      ...orderForm, 
                      quantity: quantity,
                      total_price: price * quantity
                    });
                  }}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Total Price</FormLabel>
                <NumberInput 
                  isReadOnly
                  precision={2} 
                  value={orderForm.total_price}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select 
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({...orderForm, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={orderModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveOrder}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* User Form Modal */}
      <Modal isOpen={userModal.isOpen} onClose={userModal.onClose} scrollBehavior="outside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingUserId ? 'Edit User' : 'Add User'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input 
                  value={userForm.full_name} 
                  onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired isDisabled={!!editingUserId}>
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email"
                  value={userForm.email} 
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                />
                {editingUserId && (
                  <Text fontSize="sm" color="gray.500">Email cannot be changed once created</Text>
                )}
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select 
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
              
              {!editingUserId && (
                <Text color="orange.500" fontSize="sm">
                  Note: Creating new users requires additional server-side implementation.
                </Text>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={userModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveUser}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmModal.isOpen} onClose={deleteConfirmModal.onClose} scrollBehavior="outside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this {itemToDelete.current?.type}? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={deleteConfirmModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}