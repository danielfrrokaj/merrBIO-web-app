import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './Dashboard.module.css'
import { FaUser, FaBox, FaListAlt, FaShoppingBasket, FaChartBar } from 'react-icons/fa'

function Dashboard () {
  const { isAuthenticated, isLoading, profile, signOut } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  
  // Check if user is authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Duke ngarkuar të dhënat...</p>
      </div>
    )
  }
  
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Paneli Kryesor</h1>
        <div className={styles.userInfo}>
          <span>Mirësevini, {profile?.full_name || 'Përdorues'}</span>
          <button onClick={signOut} className={styles.logoutBtn}>Dilni</button>
        </div>
      </header>
      
      <main className={styles.dashboardContent}>
        {/* Render different dashboard content based on role */}
        {profile?.role === 'farmer' ? (
          <FarmerDashboard profile={profile} />
        ) : profile?.role === 'consumer' ? (
          <ConsumerDashboard profile={profile} />
        ) : profile?.role === 'superadmin' ? (
          <AdminDashboard profile={profile} />
        ) : (
          <div className={styles.errorMessage}>
            <p>Nuk u gjet roli i përdoruesit. Ju lutem kontaktoni administratorin.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function FarmerDashboard({ profile }) {
  return (
    <div className={styles.roleDashboard}>
      <h2>Paneli i Fermerit</h2>
      
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <FaBox className={styles.statIcon} />
          <div>
            <h3>Produktet</h3>
            <p className={styles.statNumber}>12</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <FaListAlt className={styles.statIcon} />
          <div>
            <h3>Kërkesat</h3>
            <p className={styles.statNumber}>5</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <FaChartBar className={styles.statIcon} />
          <div>
            <h3>Shitjet</h3>
            <p className={styles.statNumber}>24</p>
          </div>
        </div>
      </div>
      
      <div className={styles.actionCards}>
        <div className={styles.actionCard}>
          <h3>Menaxho Produktet</h3>
          <p>Shto, modifiko ose fshij produktet tuaja</p>
          <button className={styles.actionBtn}>Produktet e Mia</button>
        </div>
        
        <div className={styles.actionCard}>
          <h3>Kërkesat e Blerjes</h3>
          <p>Shiko kërkesat për produktet tuaja</p>
          <button className={styles.actionBtn}>Shiko Kërkesat</button>
        </div>
      </div>
      
      <div className={styles.recentActivity}>
        <h3>Aktiviteti i Fundit</h3>
        <ul className={styles.activityList}>
          <li>Keni marrë një kërkesë të re për "Domate Bio" - <span className={styles.activityTime}>20 minuta më parë</span></li>
          <li>Keni pranuar kërkesën për "Mjaltë Mali" - <span className={styles.activityTime}>2 orë më parë</span></li>
          <li>Keni shtuar produktin e ri "Mollë Korça" - <span className={styles.activityTime}>dje</span></li>
        </ul>
      </div>
    </div>
  )
}

function ConsumerDashboard({ profile }) {
  return (
    <div className={styles.roleDashboard}>
      <h2>Paneli i Konsumatorit</h2>
      
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <FaListAlt className={styles.statIcon} />
          <div>
            <h3>Porositë e Mia</h3>
            <p className={styles.statNumber}>3</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <FaShoppingBasket className={styles.statIcon} />
          <div>
            <h3>Produktet e Preferuara</h3>
            <p className={styles.statNumber}>8</p>
          </div>
        </div>
      </div>
      
      <div className={styles.actionCards}>
        <div className={styles.actionCard}>
          <h3>Gjej Produkte</h3>
          <p>Zbulo produkte të freskëta nga fermerët lokalë</p>
          <button className={styles.actionBtn}>Eksploro Produktet</button>
        </div>
        
        <div className={styles.actionCard}>
          <h3>Porositë e Mia</h3>
          <p>Shiko dhe menaxho porositë tuaja</p>
          <button className={styles.actionBtn}>Shiko Porositë</button>
        </div>
      </div>
      
      <div className={styles.recentActivity}>
        <h3>Aktiviteti i Fundit</h3>
        <ul className={styles.activityList}>
          <li>Kërkesa juaj për "Domate Bio" u pranua - <span className={styles.activityTime}>3 orë më parë</span></li>
          <li>Keni bërë një kërkesë të re për "Djathë i Bardhë" - <span className={styles.activityTime}>dje</span></li>
          <li>Keni shtuar një vlerësim për produktin "Mjaltë Mali" - <span className={styles.activityTime}>3 ditë më parë</span></li>
        </ul>
      </div>
    </div>
  )
}

function AdminDashboard({ profile }) {
  return (
    <div className={styles.roleDashboard}>
      <h2>Paneli i Administratorit</h2>
      
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <FaUser className={styles.statIcon} />
          <div>
            <h3>Përdoruesit</h3>
            <p className={styles.statNumber}>48</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <FaBox className={styles.statIcon} />
          <div>
            <h3>Produktet Totale</h3>
            <p className={styles.statNumber}>156</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <FaListAlt className={styles.statIcon} />
          <div>
            <h3>Transaksionet</h3>
            <p className={styles.statNumber}>85</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <FaChartBar className={styles.statIcon} />
          <div>
            <h3>Raporte</h3>
            <p className={styles.statNumber}>12</p>
          </div>
        </div>
      </div>
      
      <div className={styles.actionCards}>
        <div className={styles.actionCard}>
          <h3>Menaxho Përdoruesit</h3>
          <p>Shiko dhe modifiko llogaritë e përdoruesve</p>
          <button className={styles.actionBtn}>Menaxho Përdoruesit</button>
        </div>
        
        <div className={styles.actionCard}>
          <h3>Produktet</h3>
          <p>Menaxho të gjitha produktet në platformë</p>
          <button className={styles.actionBtn}>Shiko Produktet</button>
        </div>
        
        <div className={styles.actionCard}>
          <h3>Raporte</h3>
          <p>Gjenero dhe shiko raporte</p>
          <button className={styles.actionBtn}>Raporte</button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 