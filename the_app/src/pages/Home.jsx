import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaLeaf, FaCarrot, FaShoppingBasket, FaMapMarkerAlt, FaStar } from 'react-icons/fa'
import { MdNaturePeople, MdFamilyRestroom, MdOutlineLocalOffer } from 'react-icons/md'
import { GiFruitBowl, GiMilkCarton, GiHoneycomb } from 'react-icons/gi'
import { useAuth } from '../contexts/AuthContext'

import styles from './Home.module.css'

function Home () {
  const { isAuthenticated, profile } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState([])
  
  useEffect(() => {
    // Mock data - would be fetched from Supabase in real implementation
    setFeaturedProducts([
      {
        id: 1,
        name: 'Domate Bio',
        price: '250 ALL/kg',
        farmer: 'Ferma Dibra',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
        category: 'Perime'
      },
      {
        id: 2,
        name: 'Mjaltë Malit',
        price: '1200 ALL/kg',
        farmer: 'Bletaria Korça',
        image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924',
        category: 'Mjaltë'
      },
      {
        id: 3,
        name: 'Djathë i Bardhë',
        price: '550 ALL/kg',
        farmer: 'Ferma Puka',
        image: 'https://images.unsplash.com/photo-1566454825481-9c29cfc00c0b',
        category: 'Bulmet'
      },
      {
        id: 4,
        name: 'Mollë Korça',
        price: '180 ALL/kg',
        farmer: 'Pemëtaria Vithkuq',
        image: 'https://images.unsplash.com/photo-1570913196095-ab5b63fda7f6',
        category: 'Fruta'
      }
    ])
  }, [])

  const categories = [
    { name: 'Fruta', icon: <GiFruitBowl /> },
    { name: 'Perime', icon: <FaCarrot /> },
    { name: 'Bulmet', icon: <GiMilkCarton /> },
    { name: 'Mjaltë', icon: <GiHoneycomb /> },
    { name: 'Bio', icon: <FaLeaf /> }
  ]

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>Tregu i Fermerëve Shqiptarë</h1>
          <p>Produktet më të freskëta direkt nga fermerët në tryezën tuaj</p>
          <button className={styles.primaryBtn}>
            Eksploro Produktet <FaShoppingBasket className={styles.iconRight} />
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className={`${styles.section} ${styles.categoriesSection}`}>
        <h2>Kategoritë <MdOutlineLocalOffer className={styles.sectionIcon} /></h2>
        <div className={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <div key={index} className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                {category.icon}
              </div>
              <h3>{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className={`${styles.section} ${styles.featuredSection}`}>
        <h2>Produktet e Zgjedhura <FaStar className={styles.sectionIcon} /></h2>
        <div className={styles.productsGrid}>
          {featuredProducts.map(product => (
            <div key={product.id} className={styles.productCard}>
              <div 
                className={styles.productImage} 
                style={{ backgroundImage: `url(${product.image})` }}
              />
              <div className={styles.productInfo}>
                <h3>{product.name}</h3>
                <p className={styles.productPrice}>{product.price}</p>
                <p className={styles.productFarmer}>
                  <FaMapMarkerAlt className={styles.iconLeft} />
                  {product.farmer}
                </p>
                <span className={styles.productCategory}>{product.category}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.centerBtn}>
          <button className={styles.secondaryBtn}>Shiko më shumë produkte</button>
        </div>
      </section>
      
      {/* About Section */}
      <section className={`${styles.section} ${styles.aboutSection}`}>
        <h2>Pse të Blini nga Fermerët Tanë? <MdNaturePeople className={styles.sectionIcon} /></h2>
        
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              <FaLeaf />
            </div>
            <h3>Produktet e Freskëta</h3>
            <p>Produkte të freskëta dhe sezonale që vijnë direkt nga fermat shqiptare.</p>
          </div>
          
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              <MdFamilyRestroom />
            </div>
            <h3>Mbështetje Komuniteti</h3>
            <p>Mbështesni familjet fermere shqiptare dhe ekonominë lokale.</p>
          </div>
          
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              <FaShoppingBasket />
            </div>
            <h3>Çmime të Drejta</h3>
            <p>Pa ndërmjetës, fermerët ofrojnë çmime më të mira dhe fitojnë më shumë.</p>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Bëhu Pjesë e Komunitetit Tonë</h2>
          <p>Regjistrohu sot për të gjetur fermerët më të mirë dhe produktet më të freskëta!</p>
          <div className={styles.ctaButtons}>
            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.primaryBtn}>
                Shko te Paneli Kryesor
              </Link>
            ) : (
              <>
                <Link to="/signup" className={styles.primaryBtn}>
                  Regjistrohu
                </Link>
                <Link to="/login" className={styles.outlineBtn}>
                  Hyni në Llogari
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home 