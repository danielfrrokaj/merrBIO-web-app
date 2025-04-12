import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const CategoryCard = ({ category }) => {
  const { t } = useTranslation();
  
  if (!category) return null;
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        }
      }}
    >
      <Link to={`/products?category=${category._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardMedia
          component="img"
          height="160"
          image={category.imageUrl || 'https://via.placeholder.com/300x200?text=Category'}
          alt={category.name}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h5" component="div">
            {category.name}
          </Typography>
          {category.description && (
            <Typography variant="body2" color="text.secondary">
              {category.description.substring(0, 100)}
              {category.description.length > 100 ? '...' : ''}
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="primary">
              {t('viewProducts')}
            </Typography>
          </Box>
        </CardContent>
      </Link>
    </Card>
  );
};

export default CategoryCard; 