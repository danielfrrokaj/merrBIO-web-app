import { Link } from 'react-router-dom'
import { FaExclamationTriangle } from 'react-icons/fa'
import styles from './Unauthorized.module.css'

function Unauthorized () {
  return (
    <div className={styles.unauthorizedContainer}>
      <div className={styles.unauthorizedCard}>
        <FaExclamationTriangle className={styles.icon} />
        <h1>Qasje e Paautorizuar</h1>
        <p>Na vjen keq, ju nuk keni të drejta për të parë këtë faqe.</p>
        <div className={styles.links}>
          <Link to="/dashboard" className={styles.dashboardLink}>
            Kthehu tek Paneli
          </Link>
          <Link to="/" className={styles.homeLink}>
            Kthehu tek Faqja Kryesore
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized 