import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEnvelope, FaLock } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Login.module.css'

function Login () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const navigate = useNavigate()
  const { signIn } = useAuth()
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setErrorMsg('')
  }
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    setErrorMsg('')
  }
  
  const validateForm = () => {
    // Check if fields are empty
    if (!email || !password) {
      setErrorMsg('Ju lutem plotësoni të gjitha fushat.')
      return false
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMsg('Ju lutem vendosni një email të vlefshëm.')
      return false
    }
    
    return true
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      const { data, error } = await signIn({ email, password })
      
      if (error) {
        throw error
      }
      
      // Redirect based on user role
      if (data?.user) {
        // Fetch the user profile to determine role
        // This is already handled by the auth context, so we can just navigate
        // to dashboard (the dashboard will handle redirects based on role)
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error during login:', error.message)
      
      // Provide user-friendly error messages
      if (error.message.includes('credentials')) {
        setErrorMsg('Email ose fjalëkalimi i gabuar.')
      } else if (error.message.includes('not confirmed')) {
        setErrorMsg('Ju lutem konfirmoni emailin tuaj para se të hyni.')
      } else {
        setErrorMsg('Ndodhi një gabim gjatë hyrjes. Ju lutem provoni përsëri.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handlePasswordReset = () => {
    navigate('/reset-password')
  }
  
  return (
    <div className={styles.loginContainer}>
      <div className={styles.formCard}>
        <h1>Hyrja</h1>
        <p className={styles.subtitle}>Hyni në llogarinë tuaj për të vazhduar</p>
        
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">
              <FaEnvelope className={styles.inputIcon} />
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="email@example.com"
              value={email}
              onChange={handleEmailChange}
              disabled={isSubmitting}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">
              <FaLock className={styles.inputIcon} />
              Fjalëkalimi
            </label>
            <input
              type="password"
              id="password"
              placeholder="Fjalëkalimi juaj"
              value={password}
              onChange={handlePasswordChange}
              disabled={isSubmitting}
            />
            <div className={styles.forgotPassword}>
              <button 
                type="button" 
                onClick={handlePasswordReset} 
                className={styles.forgotBtn}
              >
                Keni harruar fjalëkalimin?
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Duke hyrë...' : 'Hyni'}
          </button>
        </form>
        
        <div className={styles.registerLink}>
          Nuk keni një llogari? <Link to="/signup">Regjistrohu këtu</Link>
        </div>
      </div>
    </div>
  )
}

export default Login 