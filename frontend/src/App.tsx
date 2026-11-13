import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import './App.css'

// FOOD INTERFACE
interface Food {
  _id: string
  name: string
  category: string
  description: string
  price: number
  image: string
  isAvailable: boolean
}

// FOOD API RESPONSE
interface FoodResponse {
  success: boolean
  count: number
  foods: Food[]
}

// USER INTERFACE
interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

// AUTH API RESPONSE
interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}

// ORDER RESPONSE
interface OrderResponse {
  success: boolean
  message: string
  order?: {
    _id: string
    totalAmount: number
    status: string
  }
}

// CHECKOUT ITEM SNAPSHOT
interface SubmittedItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
}

// ORDER ITEM INTERFACE
interface OrderItem {
  _id: string
  name: string
  quantity: number
  price: number
  food: {
    _id: string
    name: string
    image: string
  } | null
}

// ORDER INTERFACE
interface Order {
  _id: string
  items: OrderItem[]
  totalAmount: number
  deliveryAddress: string
  phone: string
  status: string
  createdAt: string
}

// ORDERS API RESPONSE
interface OrdersResponse {
  success: boolean
  count: number
  orders: Order[]
  message?: string
}

interface AdminStats {
  totalFoods: number
  totalOrders: number
  pendingOrders: number
  deliveredOrders: number
  totalRevenue: number
}

interface AdminOrder extends Omit<Order, 'items'> {
  user: { name: string; email: string; phone: string } | null
  items: (OrderItem & { food: { _id: string; name: string; image: string } | null })[]
}

interface AdminOrdersResponse {
  success: boolean
  count: number
  orders: AdminOrder[]
  message?: string
}

function App() {
  const API_BASE =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  // FOOD STATES
  const [foods, setFoods] = useState<Food[]>([])
  const [cart, setCart] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // AUTHENTICATION STATES
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('foodexpress_user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(
    () => localStorage.getItem('foodexpress_token') || ''
  )

  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  // CHECKOUT STATES
  const [showCheckout, setShowCheckout] = useState(false)

  const [checkoutForm, setCheckoutForm] = useState({
    deliveryAddress: '',
    phone: '',
  })

  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState('')
  const [lastOrderId, setLastOrderId] = useState('')

  // SAVE ORDER SUMMARY BEFORE CLEARING CART
  const [submittedItems, setSubmittedItems] = useState<SubmittedItem[]>([])
  const [submittedTotal, setSubmittedTotal] = useState(0)

  // MY ORDERS STATES
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [showMyOrders, setShowMyOrders] = useState(false)


  // ADMIN DASHBOARD STATES
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminTab, setAdminTab] = useState<'overview' | 'foods' | 'orders'>('overview')
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [adminFoods, setAdminFoods] = useState<Food[]>([])
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminSaving, setAdminSaving] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [editingFoodId, setEditingFoodId] = useState('')
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isAvailable: true,
  })

  // FETCH FOOD ITEMS
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`${API_BASE}/foods`)

        if (!response.ok) {
          throw new Error('Unable to fetch food items.')
        }

        const data: FoodResponse = await response.json()

        if (!data.success || !Array.isArray(data.foods)) {
          throw new Error('Invalid server response.')
        }

        setFoods(data.foods)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchFoods()
  }, [API_BASE])

  // FOOD CATEGORIES
  const categories = [
    'All',
    ...Array.from(new Set(foods.map((food) => food.category))),
  ]

  // FILTER FOOD
  const filteredFoods = foods.filter((food) => {
    const matchesSearch =
      food.name.toLowerCase().includes(search.toLowerCase()) ||
      food.description.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      activeCategory === 'All' ||
      food.category === activeCategory

    return matchesSearch && matchesCategory
  })

  // ADD TO CART
  const addToCart = (foodId: string) => {
    setCart((previous) => [...previous, foodId])
  }

  // REMOVE FROM CART
  const removeFromCart = (foodId: string) => {
    setCart((previous) => {
      const index = previous.indexOf(foodId)

      if (index === -1) return previous

      const updated = [...previous]
      updated.splice(index, 1)

      return updated
    })
  }

  // GET FOOD QUANTITY
  const getFoodQuantity = (foodId: string) => {
    return cart.filter((id) => id === foodId).length
  }

  // CART TOTAL
  const cartTotal = cart.reduce((total, foodId) => {
    const food = foods.find((item) => item._id === foodId)

    return total + (food ? food.price : 0)
  }, 0)

  const cartCount = cart.length

  // SCROLL TO CART
  const scrollToCart = () => {
    document.getElementById('cart')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  // OPEN AUTHENTICATION
  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthError('')
    setAuthSuccess('')
    setShowAuth(true)
  }

  // HANDLE AUTH INPUT
  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value,
    })
  }

  // LOGIN AND REGISTER
  const handleAuthSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    const endpoint =
      authMode === 'register'
        ? '/auth/register'
        : '/auth/login'

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          authMode === 'register'
            ? authForm
            : {
                email: authForm.email,
                password: authForm.password,
              }
        ),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed.')
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid authentication response.')
      }

      localStorage.setItem('foodexpress_token', data.token)
      localStorage.setItem(
        'foodexpress_user',
        JSON.stringify(data.user)
      )

      setToken(data.token)
      setUser(data.user)

      setAuthSuccess(data.message)

      setAuthForm({
        name: '',
        email: '',
        phone: '',
        password: '',
      })

      setTimeout(() => {
        setShowAuth(false)
        setAuthSuccess('')
      }, 1000)
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setAuthLoading(false)
    }
  }

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('foodexpress_token')
    localStorage.removeItem('foodexpress_user')

    setToken('')
    setUser(null)
    setShowAdmin(false)
    setOrders([])
    setShowMyOrders(false)

    alert('You have logged out successfully.')
  }

  // OPEN CHECKOUT
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty.')
      return
    }

    if (!user || !token) {
      openAuth('login')
      setAuthError('Please log in before proceeding to checkout.')
      return
    }

    setCheckoutForm({
      deliveryAddress: '',
      phone: user.phone || '',
    })

    setOrderError('')
    setOrderSuccess('')
    setLastOrderId('')
    setSubmittedItems([])
    setSubmittedTotal(0)

    setShowCheckout(true)
  }

  // HANDLE CHECKOUT INPUT
  const handleCheckoutInput = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setCheckoutForm({
      ...checkoutForm,
      [event.target.name]: event.target.value,
    })
  }

  // PLACE ORDER
  const handlePlaceOrder = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!token) {
      setOrderError('Your session has expired. Please log in again.')
      return
    }

    if (cart.length === 0) {
      setOrderError('Your cart is empty.')
      return
    }

    if (!checkoutForm.deliveryAddress.trim() || !checkoutForm.phone.trim()) {
      setOrderError('Please enter your delivery address and phone number.')
      return
    }

    setOrderLoading(true)
    setOrderError('')
    setOrderSuccess('')

    // PREPARE ORDER ITEMS
    const orderItems = Array.from(new Set(cart)).map((foodId) => ({
      food: foodId,
      quantity: getFoodQuantity(foodId),
    }))

    // SAVE A SNAPSHOT OF THE CART
    const itemsSnapshot: SubmittedItem[] = Array.from(
      new Set(cart)
    ).flatMap((foodId) => {
      const food = foods.find((item) => item._id === foodId)

      if (!food) return []

      return [{
        id: foodId,
        name: food.name,
        image: food.image,
        price: food.price,
        quantity: getFoodQuantity(foodId),
      }]
    })

    const totalSnapshot = cartTotal

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          deliveryAddress: checkoutForm.deliveryAddress.trim(),
          phone: checkoutForm.phone.trim(),
        }),
      })

      const data: OrderResponse = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          throw new Error(
            'Your login session is invalid or expired. Please log in again.'
          )
        }

        throw new Error(data.message || 'Unable to place your order.')
      }

      // SAVE SUCCESSFUL ORDER SUMMARY
      setSubmittedItems(itemsSnapshot)
      setSubmittedTotal(data.order?.totalAmount ?? totalSnapshot)

      setOrderSuccess('Your order has been placed successfully!')

      if (data.order?._id) {
        setLastOrderId(data.order._id)
      }

      // CLEAR CART AFTER SUCCESS
      setCart([])

      setCheckoutForm({
        deliveryAddress: '',
        phone: '',
      })
    } catch (err) {
      setOrderError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setOrderLoading(false)
    }
  }

  // CLOSE CHECKOUT
  const closeCheckout = () => {
    if (orderLoading) return

    setShowCheckout(false)
    setOrderError('')
    setOrderSuccess('')
    setLastOrderId('')
    setSubmittedItems([])
    setSubmittedTotal(0)
  }

  // FETCH MY ORDERS
  const handleShowOrders = async () => {
    if (!user || !token) {
      openAuth('login')
      setAuthError('Please log in to view your orders.')
      return
    }

    setShowMyOrders(true)
    setOrdersLoading(true)
    setOrdersError('')

    try {
      const response = await fetch(`${API_BASE}/orders/my-orders`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data: OrdersResponse = await response.json()

      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.')
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load your orders.')
      }

      setOrders(data.orders || [])

      setTimeout(() => {
        document.getElementById('my-orders')?.scrollIntoView({
          behavior: 'smooth',
        })
      }, 100)
    } catch (err) {
      setOrdersError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setOrdersLoading(false)
    }
  }

  // VIEW ORDERS AFTER CHECKOUT
  const viewOrdersAfterCheckout = async () => {
    setShowCheckout(false)
    setOrderSuccess('')
    setSubmittedItems([])
    setSubmittedTotal(0)
    setLastOrderId('')

    await handleShowOrders()
  }

  // BACK TO MENU
  const backToMenu = () => {
    setShowMyOrders(false)

    document.getElementById('menu')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  // ADMIN API REQUEST HELPER
  const adminRequest = async (path: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Please log in with an administrator account.')

    const response = await fetch(`${API_BASE}/admin${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> | undefined),
      },
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Admin request failed.')
    }
    return data
  }

  // LOAD ADMIN DASHBOARD DATA
  const loadAdminDashboard = async () => {
    if (!user || user.role !== 'admin' || !token) {
      setAdminError('Administrator access is required. Log in with your admin account.')
      return
    }

    setAdminLoading(true)
    setAdminError('')
    try {
      const [statsData, foodsData, ordersData] = await Promise.all([
        adminRequest('/stats'),
        adminRequest('/foods'),
        adminRequest('/orders'),
      ])
      setAdminStats(statsData.stats)
      setAdminFoods(foodsData.foods || [])
      setFoods(foodsData.foods || [])
      setAdminOrders(
  (ordersData as AdminOrdersResponse).orders || []
)
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to load admin dashboard.')
    } finally {
      setAdminLoading(false)
    }
  }

  const openAdminDashboard = async () => {
    setShowAdmin(true)
    setShowMyOrders(false)
    setAdminTab('overview')
    await loadAdminDashboard()
    setTimeout(() => document.getElementById('admin-dashboard')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const resetFoodForm = () => {
    setEditingFoodId('')
    setFoodForm({ name: '', description: '', price: '', category: '', image: '', isAvailable: true })
  }

  const editFood = (food: Food) => {
    setEditingFoodId(food._id)
    setFoodForm({
      name: food.name,
      description: food.description,
      price: String(food.price),
      category: food.category,
      image: food.image,
      isAvailable: food.isAvailable,
    })
    setAdminTab('foods')
    document.getElementById('admin-food-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFoodFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFoodForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleFoodSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminSaving(true)
    setAdminError('')
    setAdminMessage('')
    try {
      const payload = {
        ...foodForm,
        price: Number(foodForm.price),
        isAvailable: foodForm.isAvailable,
      }
      const data = await adminRequest(
        editingFoodId ? `/foods/${editingFoodId}` : '/foods',
        { method: editingFoodId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      setAdminMessage(data.message || 'Food item saved successfully.')
      resetFoodForm()
      await loadAdminDashboard()
      setAdminTab('foods')
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to save food item.')
    } finally {
      setAdminSaving(false)
    }
  }

  const deleteFood = async (foodId: string) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return
    setAdminError('')
    setAdminMessage('')
    try {
      const data = await adminRequest(`/foods/${foodId}`, { method: 'DELETE' })
      setAdminMessage(data.message || 'Food item deleted.')
      await loadAdminDashboard()
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to delete food item.')
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    setAdminError('')
    setAdminMessage('')
    try {
      const data = await adminRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setAdminMessage(data.message || 'Order status updated.')
      await loadAdminDashboard()
      setAdminTab('orders')
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to update order status.')
    }
  }

  const closeAdminDashboard = () => {
    setShowAdmin(false)
    setAdminError('')
    setAdminMessage('')
    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="website">

      {/* NAVIGATION */}
      <nav className="navbar">
        <div className="logo">
          <h2>FoodExpress</h2>
        </div>

        <div className="nav-actions">
          <a href="#home">Home</a>
          <a href="#menu">Menu</a>
          <a href="#about">About</a>

          <button onClick={scrollToCart}>
            Cart ({cartCount})
          </button>

          {user ? (
            <div className="user-actions">
              <span>Hi, {user.name}</span>

              <button onClick={handleShowOrders}>
                My Orders
              </button>

              {user.role === 'admin' && (
                <button onClick={openAdminDashboard}>
                  Admin Dashboard
                </button>
              )}

              <button onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons">
              <button onClick={() => openAuth('login')}>
                Login
              </button>

              <button onClick={() => openAuth('register')}>
                Register
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* AUTHENTICATION MODAL */}
      {showAuth && (
        <div
          className="auth-overlay"
          onClick={() => setShowAuth(false)}
        >
          <div
            className="auth-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="auth-close"
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>

            <h2>
              {authMode === 'login'
                ? 'Welcome Back!'
                : 'Create Your Account'}
            </h2>

            <p>
              {authMode === 'login'
                ? 'Login to your FoodExpress account.'
                : 'Register to start ordering delicious food.'}
            </p>

            <form onSubmit={handleAuthSubmit}>

              {authMode === 'register' && (
                <>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={authForm.name}
                    onChange={handleInputChange}
                    required
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={authForm.phone}
                    onChange={handleInputChange}
                    required
                  />
                </>
              )}

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={authForm.email}
                onChange={handleInputChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password (minimum 8 characters)"
                value={authForm.password}
                onChange={handleInputChange}
                minLength={8}
                required
              />

              {authError && (
                <p className="auth-error">
                  {authError}
                </p>
              )}

              {authSuccess && (
                <p className="auth-success">
                  {authSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Login'
                    : 'Create Account'}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                  >
                    Register
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div
          className="auth-overlay"
          onClick={closeCheckout}
        >
          <div
            className="auth-modal checkout-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="auth-close"
              onClick={closeCheckout}
              disabled={orderLoading}
            >
              ×
            </button>

            {!orderSuccess ? (
              <>
                <h2>Complete Your Order</h2>

                <p>Enter your delivery details.</p>

                <div className="checkout-summary">
                  <h3>Order Summary</h3>

                  {Array.from(new Set(cart)).map((foodId) => {
                    const food = foods.find(
                      (item) => item._id === foodId
                    )

                    if (!food) return null

                    const quantity = getFoodQuantity(foodId)

                    return (
                      <p key={foodId}>
                        {food.name} × {quantity} = Rs.{' '}
                        {(food.price * quantity).toLocaleString()}
                      </p>
                    )
                  })}

                  <h3>
                    Total: Rs. {cartTotal.toLocaleString()}
                  </h3>
                </div>

                <form onSubmit={handlePlaceOrder}>

                  <input
                    type="text"
                    name="deliveryAddress"
                    placeholder="Delivery Address"
                    value={checkoutForm.deliveryAddress}
                    onChange={handleCheckoutInput}
                    required
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={checkoutForm.phone}
                    onChange={handleCheckoutInput}
                    required
                  />

                  {orderError && (
                    <p className="auth-error">
                      {orderError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={orderLoading}
                  >
                    {orderLoading
                      ? 'Placing Order...'
                      : 'Place Order'}
                  </button>
                </form>
              </>
            ) : (
              <div className="order-success">
                <h3>Order Confirmed!</h3>

                <p>{orderSuccess}</p>

                <div className="checkout-summary">
                  <h3>Order Summary</h3>

                  {submittedItems.map((item) => (
                    <p key={item.id}>
                      {item.name} × {item.quantity} = Rs.{' '}
                      {(item.price * item.quantity).toLocaleString()}
                    </p>
                  ))}

                  <h3>
                    Total: Rs. {submittedTotal.toLocaleString()}
                  </h3>
                </div>

                {lastOrderId && (
                  <p>
                    <strong>Order ID:</strong> {lastOrderId}
                  </p>
                )}

                <button
                  type="button"
                  onClick={viewOrdersAfterCheckout}
                >
                  View My Orders
                </button>

                <button
                  type="button"
                  onClick={closeCheckout}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {showAdmin && user?.role === 'admin' && (
        <section className="admin-section" id="admin-dashboard">
          <div className="admin-heading-row">
            <div>
              <p className="admin-eyebrow">FOODEXPRESS CONTROL PANEL</p>
              <h1>Admin Dashboard</h1>
              <p>Manage your menu, orders, and store performance.</p>
            </div>
            <div className="admin-heading-actions">
              <button className="admin-secondary-button" onClick={loadAdminDashboard} disabled={adminLoading}>
                {adminLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button className="admin-secondary-button" onClick={closeAdminDashboard}>Back to Website</button>
            </div>
          </div>

          <div className="admin-tabs">
            <button className={adminTab === 'overview' ? 'active' : ''} onClick={() => setAdminTab('overview')}>Overview</button>
            <button className={adminTab === 'foods' ? 'active' : ''} onClick={() => setAdminTab('foods')}>Manage Foods</button>
            <button className={adminTab === 'orders' ? 'active' : ''} onClick={() => setAdminTab('orders')}>Manage Orders</button>
          </div>

          {adminError && <div className="admin-alert admin-alert-error">{adminError}</div>}
          {adminMessage && <div className="admin-alert admin-alert-success">{adminMessage}</div>}
          {adminLoading && <div className="loading"><h3>Loading dashboard data...</h3></div>}

          {!adminLoading && adminTab === 'overview' && (
            <>
              <div className="admin-stats-grid">
                <div className="admin-stat-card"><span>Total Food Items</span><strong>{adminStats?.totalFoods ?? 0}</strong><small>Items in your menu</small></div>
                <div className="admin-stat-card"><span>Total Orders</span><strong>{adminStats?.totalOrders ?? 0}</strong><small>All customer orders</small></div>
                <div className="admin-stat-card"><span>Pending Orders</span><strong>{adminStats?.pendingOrders ?? 0}</strong><small>Waiting for processing</small></div>
                <div className="admin-stat-card"><span>Delivered Orders</span><strong>{adminStats?.deliveredOrders ?? 0}</strong><small>Successfully delivered</small></div>
                <div className="admin-stat-card admin-revenue-card"><span>Total Revenue</span><strong>Rs. {(adminStats?.totalRevenue ?? 0).toLocaleString()}</strong><small>Excludes cancelled orders</small></div>
              </div>
              <div className="admin-panel">
                <div className="admin-panel-heading"><div><h2>Recent Orders</h2><p>Latest customer orders from your database.</p></div><button className="admin-primary-button" onClick={() => setAdminTab('orders')}>View All Orders</button></div>
                {adminOrders.length === 0 ? <p className="admin-empty">No orders found.</p> : (
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>
                    {adminOrders.slice(0, 5).map((order) => <tr key={order._id}><td>#{order._id.slice(-7)}</td><td>{order.user?.name || 'Unknown customer'}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>Rs. {order.totalAmount.toLocaleString()}</td><td><span className={`order-status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></td></tr>)}
                  </tbody></table></div>
                )}
              </div>
            </>
          )}

          {!adminLoading && adminTab === 'foods' && (
            <div className="admin-food-layout">
              <div className="admin-panel admin-food-form-panel" id="admin-food-form">
                <div className="admin-panel-heading"><div><h2>{editingFoodId ? 'Edit Food Item' : 'Add New Food'}</h2><p>{editingFoodId ? 'Update the selected menu item.' : 'Add a new item to your customer menu.'}</p></div></div>
                <form className="admin-food-form" onSubmit={handleFoodSubmit}>
                  <label>Food Name<input name="name" value={foodForm.name} onChange={handleFoodFormChange} required /></label>
                  <label>Description<textarea name="description" value={foodForm.description} onChange={handleFoodFormChange} rows={3} required /></label>
                  <div className="admin-form-two-columns">
                    <label>Price (Rs.)<input name="price" type="number" min="0" step="1" value={foodForm.price} onChange={handleFoodFormChange} required /></label>
                    <label>Category<input name="category" value={foodForm.category} onChange={handleFoodFormChange} required /></label>
                  </div>
                  <label>Image URL<input name="image" type="url" value={foodForm.image} onChange={handleFoodFormChange} placeholder="https://example.com/food.jpg" required /></label>
                  <label className="admin-checkbox-label"><input type="checkbox" checked={foodForm.isAvailable} onChange={(event) => setFoodForm((previous) => ({ ...previous, isAvailable: event.target.checked }))} /> Available for customers</label>
                  <div className="admin-form-actions"><button className="admin-primary-button" type="submit" disabled={adminSaving}>{adminSaving ? 'Saving...' : editingFoodId ? 'Update Food' : 'Add Food'}</button>{editingFoodId && <button className="admin-secondary-button" type="button" onClick={resetFoodForm}>Cancel Edit</button>}</div>
                </form>
              </div>
              <div className="admin-panel">
                <div className="admin-panel-heading"><div><h2>Food Menu</h2><p>{adminFoods.length} food items in the database.</p></div></div>
                {adminFoods.length === 0 ? <p className="admin-empty">No food items found. Add your first item.</p> : (
                  <div className="admin-food-list">{adminFoods.map((food) => (
                    <div className="admin-food-row" key={food._id}>
                      <img src={food.image} alt={food.name} onError={(event) => { event.currentTarget.src = 'https://placehold.co/100x100?text=Food' }} />
                      <div className="admin-food-info"><h3>{food.name}</h3><p>{food.category} · Rs. {food.price.toLocaleString()}</p><span className={food.isAvailable ? 'admin-available' : 'admin-unavailable'}>{food.isAvailable ? 'Available' : 'Unavailable'}</span></div>
                      <div className="admin-row-actions"><button className="admin-edit-button" onClick={() => editFood(food)}>Edit</button><button className="admin-delete-button" onClick={() => deleteFood(food._id)}>Delete</button></div>
                    </div>
                  ))}</div>
                )}
              </div>
            </div>
          )}

          {!adminLoading && adminTab === 'orders' && (
            <div className="admin-panel">
              <div className="admin-panel-heading"><div><h2>Customer Orders</h2><p>Review orders and update their delivery status.</p></div><span className="admin-order-count">{adminOrders.length} orders</span></div>
              {adminOrders.length === 0 ? <p className="admin-empty">No customer orders found.</p> : (
                <div className="admin-orders-list">{adminOrders.map((order) => (
                  <article className="admin-order-card" key={order._id}>
                    <div className="admin-order-top"><div><h3>Order #{order._id.slice(-8)}</h3><p>{new Date(order.createdAt).toLocaleString()}</p></div><strong>Rs. {order.totalAmount.toLocaleString()}</strong></div>
                    <div className="admin-customer-details"><p><strong>Customer:</strong> {order.user?.name || 'Unknown'} ({order.user?.email || 'No email'})</p><p><strong>Phone:</strong> {order.phone || order.user?.phone || 'Not provided'}</p><p><strong>Address:</strong> {order.deliveryAddress}</p></div>
                    <div className="admin-order-items">{order.items.map((item, index) => <span key={item._id || `${order._id}-${index}`}>{item.name} × {item.quantity}</span>)}</div>
                    <div className="admin-order-bottom"><span className={`order-status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span><label>Update status<select value={order.status} onChange={(event) => updateOrderStatus(order._id, event.target.value)}><option>Pending</option><option>Confirmed</option><option>Preparing</option><option>Out for Delivery</option><option>Delivered</option><option>Cancelled</option></select></label></div>
                  </article>
                ))}</div>
              )}
            </div>
          )}
        </section>
      )}

      {!showAdmin && (
        <>
      {/* HERO SECTION */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <h1>Delicious Food Delivered To Your Door</h1>

          <p>
            Enjoy your favourite meals prepared fresh and delivered
            directly to your home.
          </p>

          <a href="#menu" className="hero-button">
            Order Now
          </a>
        </div>
      </section>

      {/* MENU SECTION */}
      <section className="menu-section" id="menu">
        <div className="section-heading">
          <h2>Our Delicious Menu</h2>
          <p>Explore our delicious food collection.</p>
        </div>

        <div className="search">
          <input
            type="text"
            placeholder="Search your favourite food..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="categories">
          {categories.map((category) => (
            <button
              key={category}
              className={
                activeCategory === category ? 'active' : ''
              }
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading">
            <h3>Loading delicious food...</h3>
          </div>
        )}

        {!loading && error && (
          <div className="error">
            <h3>Unable to load food items</h3>
            <p>{error}</p>

            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="food-grid">
            {filteredFoods.length > 0 ? (
              filteredFoods.map((food) => (
                <div className="food-card" key={food._id}>
                  <img
                    src={food.image}
                    alt={food.name}
                    onError={(event) => {
                      event.currentTarget.src =
                        'https://placehold.co/600x400?text=Food+Image'
                    }}
                  />

                  <div className="food-card-content">
                    <h3>{food.name}</h3>

                    <p>{food.description}</p>

                    <div className="food-details">
                      <span>
                        Rs. {food.price.toLocaleString()}
                      </span>
                      <span>⭐ 4.8</span>
                    </div>

                    <button
                      onClick={() => addToCart(food._id)}
                      disabled={!food.isAvailable}
                    >
                      {!food.isAvailable
                        ? 'Unavailable'
                        : 'Add to Cart'}
                    </button>

                    {getFoodQuantity(food._id) > 0 && (
                      <p>
                        In Cart: {getFoodQuantity(food._id)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <h3>No food items found</h3>
                <p>Try another search or category.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* MY ORDERS SECTION */}
      {showMyOrders && (
        <section className="my-orders-section" id="my-orders">

          <div className="section-heading">
            <h2>My Orders</h2>
            <p>Track and review your previous orders.</p>
          </div>

          <button
            className="back-to-menu"
            onClick={backToMenu}
          >
            Back to Menu
          </button>

          <button
            className="refresh-orders"
            onClick={handleShowOrders}
            disabled={ordersLoading}
          >
            {ordersLoading ? 'Refreshing...' : 'Refresh Orders'}
          </button>

          {ordersLoading && (
            <div className="loading">
              <h3>Loading your orders...</h3>
            </div>
          )}

          {ordersError && (
            <div className="error">
              <p>{ordersError}</p>

              <button onClick={handleShowOrders}>
                Try Again
              </button>
            </div>
          )}

          {!ordersLoading &&
            !ordersError &&
            orders.length === 0 && (
              <div className="no-results">
                <h3>No Orders Yet</h3>
                <p>Your previous orders will appear here.</p>
              </div>
            )}

          {!ordersLoading &&
            !ordersError &&
            orders.length > 0 && (
              <div className="orders-grid">

                {orders.map((order) => (
                  <div className="order-card" key={order._id}>

                    <div className="order-header">
                      <div>
                        <h3>Order Details</h3>

                        <p>
                          Order ID: {order._id}
                        </p>

                        <p>
                          Date:{' '}
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <span
                        className={`order-status ${order.status
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="order-products">
                      {order.items.map((item, index) => (
                        <div
                          className="order-product"
                          key={item._id || `${order._id}-${index}`}
                        >

                          <img
                            src={
                              item.food?.image ||
                              'https://placehold.co/100x100?text=Food'
                            }
                            alt={item.name}
                            onError={(event) => {
                              event.currentTarget.src =
                                'https://placehold.co/100x100?text=Food'
                            }}
                          />

                          <div>
                            <h4>{item.name}</h4>

                            <p>
                              Quantity: {item.quantity}
                            </p>

                            <p>
                              Price: Rs.{' '}
                              {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>

                        </div>
                      ))}
                    </div>

                    <div className="order-information">
                      <p>
                        <strong>Delivery Address:</strong>{' '}
                        {order.deliveryAddress}
                      </p>

                      <p>
                        <strong>Phone:</strong> {order.phone}
                      </p>
                    </div>

                    <div className="order-total">
                      <h3>
                        Total: Rs.{' '}
                        {order.totalAmount.toLocaleString()}
                      </h3>
                    </div>

                  </div>
                ))}

              </div>
            )}

        </section>
      )}

      {/* CART SECTION */}
      <section className="cart-section" id="cart">
        <div className="section-heading">
          <h2>Your Shopping Cart</h2>
          <p>Review your selected food items.</p>
        </div>

        <div className="cart-items">
          {cartCount === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {Array.from(new Set(cart)).map((foodId) => {
                const food = foods.find(
                  (item) => item._id === foodId
                )

                if (!food) return null

                const quantity = getFoodQuantity(foodId)

                return (
                  <div className="cart-item" key={foodId}>
                    <div>
                      <h3>{food.name}</h3>

                      <p>
                        Rs. {food.price} × {quantity}
                      </p>

                      <p>
                        Subtotal: Rs.{' '}
                        {(food.price * quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="cart-item-actions">
                      <button
                        onClick={() => removeFromCart(foodId)}
                      >
                        Remove
                      </button>

                      <button
                        onClick={() => addToCart(foodId)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}

              <div className="cart-total">
                <h3>
                  Total: Rs. {cartTotal.toLocaleString()}
                </h3>

                <button onClick={handleCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about-section" id="about">
        <div className="section-heading">
          <h2>Why Choose FoodExpress?</h2>

          <p>
            We make ordering your favourite food simple,
            convenient and enjoyable.
          </p>
        </div>

        <div className="features">
          <div className="feature">
            <h3>🚀 Fast Delivery</h3>
            <p>Get your favourite meals delivered quickly.</p>
          </div>

          <div className="feature">
            <h3>🍔 Fresh Food</h3>
            <p>Enjoy freshly prepared and delicious meals.</p>
          </div>

          <div className="feature">
            <h3>💳 Easy Ordering</h3>
            <p>Choose your food and add it to your cart easily.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <h2>FoodExpress</h2>

        <p>Delicious food, delivered with care.</p>

        <p>
          © {new Date().getFullYear()} FoodExpress.
          All rights reserved.
        </p>
      </footer>
        </>
      )}

    </div>
  )
}

export default App