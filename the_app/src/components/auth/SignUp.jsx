import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaUser, FaEnvelope, FaLock, FaShoppingBasket } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'
import styles from './SignUp.module.css'

function SignUp () {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'consumer' // default role
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const navigate = useNavigate()
  const { signUp } = useAuth()
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error messages when user starts typing
    setErrorMsg('')
  }
  
  const validateForm = () => {
    // Check if all fields are filled
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setErrorMsg('Ju lutem plotësoni të gjitha fushat.')
      return false
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrorMsg('Ju lutem vendosni një email të vlefshëm.')
      return false
    }
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Fjalëkalimet nuk përputhen.')
      return false
    }
    
    // Check password strength
    if (formData.password.length < 8) {
      setErrorMsg('Fjalëkalimi duhet të ketë të paktën 8 karaktere.')
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
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role
      })
      
      if (error) {
        throw error
      }
      
      // Check if email confirmation is required
      if (data?.user && !data?.session) {
        setSuccessMsg('Ju lutem konfirmoni emailin tuaj për të përfunduar regjistrimin.')
      } else if (data?.session) {
        // If session exists, user is already signed in
        setSuccessMsg('Regjistrimi u krye me sukses!')
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('Error during registration:', error.message)
      
      // Provide user-friendly error messages
      if (error.message.includes('email')) {
        setErrorMsg('Ky email është tashmë i regjistruar.')
      } else {
        setErrorMsg('Ndodhi një gabim gjatë regjistrimit. Ju lutem provoni përsëri.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className={styles.signupContainer}>
      <div className={styles.formCard}>
        <h1>Regjistrohu</h1>
        <p className={styles.subtitle}>Krijoni një llogari për të shfrytëzuar shërbimin</p>
        
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName">
              <FaUser className={styles.inputIcon} />
              Emri i plotë
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Emri juaj i plotë"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">
              <FaEnvelope className={styles.inputIcon} />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              placeholder="Minimum 8 karaktere"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">
              <FaLock className={styles.inputIcon} />
              Konfirmo Fjalëkalimin
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Konfirmo fjalëkalimin"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Zgjidhni llojin e llogarisë</label>
            <div className={styles.roleSelector}>
              <button
                type="button"
                className={`${styles.roleButton} ${formData.role === 'consumer' ? styles.activeRole : ''}`}
                onClick={() => setFormData({ ...formData, role: 'consumer' })}
                disabled={isSubmitting}
              >
                <FaShoppingBasket className={styles.roleIcon} />
                <span>Konsumator</span>
              </button>
              <button
                type="button"
                className={`${styles.roleButton} ${formData.role === 'farmer' ? styles.activeRole : ''}`}
                onClick={() => setFormData({ ...formData, role: 'farmer' })}
                disabled={isSubmitting}
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Duke regjistruar...' : 'Regjistrohu'}
          </button>
        </form>
        
        <div className={styles.loginLink}>
          Keni tashmë një llogari? <Link to="/login">Hyni këtu</Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp 