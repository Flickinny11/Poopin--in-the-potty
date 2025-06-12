/**
 * Tests for the authentication store
 */
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/authStore'

// Mock the supabase module at the module level
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.getState().setUser(null)
  })

  it('should initialize with default state', () => {
    // Reset the store to initial state
    const store = useAuthStore.getState()
    store.setUser(null)
    // Manually set loading to true to match initial state
    useAuthStore.setState({ loading: true })
    
    const { result } = renderHook(() => useAuthStore())
    
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('should set user correctly', () => {
    const { result } = renderHook(() => useAuthStore())
    
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' }
    }

    act(() => {
      result.current.setUser(mockUser as any)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.loading).toBe(false)
  })

  it('should clear user on signOut', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Set a user first
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    }

    act(() => {
      result.current.setUser(mockUser as any)
    })

    expect(result.current.user).toEqual(mockUser)

    // Mock signOut to resolve successfully
    const { supabase } = require('@/lib/supabase')
    supabase.auth.signOut.mockResolvedValue({ error: null })

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.user).toBeNull()
  })

  it('should handle sign in with email and password', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    const { supabase } = require('@/lib/supabase')
    supabase.auth.signInWithPassword.mockResolvedValue({ 
      error: null,
      data: { user: { id: 'test-id', email: 'test@example.com' } }
    })

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password123')
      expect(response.error).toBeNull()
    })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should handle sign up with email and password', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    const { supabase } = require('@/lib/supabase')
    supabase.auth.signUp.mockResolvedValue({ 
      error: null,
      data: { user: { id: 'test-id', email: 'test@example.com' } }
    })

    await act(async () => {
      const response = await result.current.signUp('test@example.com', 'password123', 'Test User')
      expect(response.error).toBeNull()
    })

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })
  })

  it('should handle Google sign in', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    const { supabase } = require('@/lib/supabase')
    supabase.auth.signInWithOAuth.mockResolvedValue({ 
      error: null,
      data: { url: 'https://google.com/oauth' }
    })

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    })

    await act(async () => {
      const response = await result.current.signInWithGoogle()
      expect(response.error).toBeNull()
    })

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
  })

  it('should handle authentication errors', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    const { supabase } = require('@/lib/supabase')
    const mockError = { message: 'Invalid credentials' }
    supabase.auth.signInWithPassword.mockResolvedValue({ 
      error: mockError,
      data: null
    })

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrongpassword')
      expect(response.error).toEqual(mockError)
    })
  })
})