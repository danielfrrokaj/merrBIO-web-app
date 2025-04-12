import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaEnvelope } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'
import styles from './ResetPassword.module.css'

function ResetPassword () {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  
  const { resetPassword } = useAuth()
  
  const handleChange = (e) => {
    setEmail(e.target.value)
    setMessage('')
  }
  
  const validateForm = () => {
    if (!email) {
      setMessage('Ju lutem vendosni emailin tuaj.')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage('Ju lutem vendosni një email të vlefshëm.')
      return false
    }
    
    return true
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setMessage('')
    
    try {
      const { error } = await resetPassword(email)
      
      if (error) throw error
      
      setIsSuccess(true)
      setMessage('Ju lutem kontrolloni emailin tuaj për udhëzimet e rivendosjes së fjalëkalimit.')
    } catch (error) {
      console.error('Error requesting password reset:', error.message)
      setIsSuccess(false)
      setMessage('Ndodhi një gabim. Ju lutem provoni përsëri.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className={styles.resetContainer}>
      <div className={styles.formCard}>
        <h1>Rivendosja e Fjalëkalimit</h1>
        <p className={styles.subtitle}>
          Vendosni emailin tuaj dhe do t'ju dërgojmë një link për të rivendosur fjalëkalimin.
        </p>
        
        {message && (
          <div className={isSuccess ? styles.successMessage : styles.errorMessage}>
            {message}
          </div>
        )}
        
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
              onChange={handleChange}
              disabled={isSubmitting || isSuccess}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting ? 'Duke dërguar...' : 'Dërgo Linkun e Rivendosjes'}
          </button>
        </form>
        
        <div className={styles.loginLink}>
          <Link to="/login">Kthehu tek faqja e hyrjes</Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword 