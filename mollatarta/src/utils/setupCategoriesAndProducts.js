import { supabase } from '../supabaseClient';

/**
 * Creates the categories table and product_categories junction table if they don't exist,
 * and adds sample data.
 */
export async function setupCategoriesAndProducts() {
  console.log('Setting up categories and product relationships...');
  
  try {
    // Check if categories table exists
    const { error: categoriesExistError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (categoriesExistError) {
      console.log('Categories table does not exist. Creating tables...');
      
      // Create the categories table
      const { error: createCategoriesError } = await supabase.rpc('create_categories_table');
      
      if (createCategoriesError) {
        console.error('Error creating categories table:', createCategoriesError);
        return false;
      }
      
      // Create the product_categories junction table
      const { error: createJunctionError } = await supabase.rpc('create_product_categories_table');
      
      if (createJunctionError) {
        console.error('Error creating product_categories table:', createJunctionError);
        return false;
      }
      
      console.log('Created categories and product_categories tables successfully');
    } else {
      console.log('Categories table already exists. Checking for data...');
    }
    
    // Check if categories already have data
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      return false;
    }
    
    if (!existingCategories || existingCategories.length === 0) {
      console.log('No categories found. Adding default categories...');
      
      // Insert default categories
      const defaultCategories = [
        {
          name: 'Vegetables',
          description: 'Fresh, locally grown vegetables',
          image_url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
        },
        {
          name: 'Fruits',
          description: 'Sweet and nutritious fruits',
          image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
        },
        {
          name: 'Dairy',
          description: 'Milk, cheese, and other dairy products',
          image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b1b7181?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
        },
        {
          name: 'Meat',
          description: 'Ethically raised meat products',
          image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
        },
        {
          name: 'Eggs',
          description: 'Fresh farm eggs',
          image_url: 'https://images.unsplash.com/photo-1598965675603-9e587a4c3f02?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
        },
        {
          name: 'Honey',
          description: 'Local honey and bee products',
          image_url: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
        }
      ];
      
      const { error: insertError } = await supabase
        .from('categories')
        .insert(defaultCategories);
      
      if (insertError) {
        console.error('Error inserting default categories:', insertError);
        return false;
      }
      
      console.log('Added default categories successfully');
    } else {
      console.log(`Found ${existingCategories.length} existing categories`);
    }
    
    // Now, assign existing products to categories
    console.log('Checking for existing products to categorize...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return false;
    }
    
    if (!products || products.length === 0) {
      console.log('No products found to categorize.');
      return true;
    }
    
    console.log(`Found ${products.length} products to categorize.`);
    
    // Fetch categories again (in case we just created them)
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError || !categories) {
      console.error('Error fetching categories for product assignment:', categoriesError);
      return false;
    }
    
    // Check if products are already categorized
    const { data: existingAssignments, error: assignmentsError } = await supabase
      .from('product_categories')
      .select('product_id');
    
    if (assignmentsError) {
      console.error('Error checking existing product categories:', assignmentsError);
      return false;
    }
    
    const assignedProductIds = new Set(existingAssignments?.map(a => a.product_id) || []);
    const productsToAssign = products.filter(p => !assignedProductIds.has(p.id));
    
    if (productsToAssign.length === 0) {
      console.log('All products are already categorized.');
      return true;
    }
    
    console.log(`Assigning ${productsToAssign.length} products to categories...`);
    
    // Create assignments with some basic rules based on product names
    const assignments = [];
    
    const categoryMap = {
      'vegetable': categories.find(c => c.name === 'Vegetables')?.id,
      'fruit': categories.find(c => c.name === 'Fruits')?.id,
      'dairy': categories.find(c => c.name === 'Dairy')?.id,
      'milk': categories.find(c => c.name === 'Dairy')?.id,
      'cheese': categories.find(c => c.name === 'Dairy')?.id,
      'yogurt': categories.find(c => c.name === 'Dairy')?.id,
      'meat': categories.find(c => c.name === 'Meat')?.id,
      'beef': categories.find(c => c.name === 'Meat')?.id,
      'pork': categories.find(c => c.name === 'Meat')?.id,
      'chicken': categories.find(c => c.name === 'Meat')?.id,
      'egg': categories.find(c => c.name === 'Eggs')?.id,
      'honey': categories.find(c => c.name === 'Honey')?.id
    };
    
    // Vegetable names for categorization
    const vegetables = [
      'tomato', 'potato', 'carrot', 'onion', 'garlic', 'lettuce', 'spinach',
      'broccoli', 'cabbage', 'cucumber', 'zucchini', 'pepper', 'eggplant',
      'celery', 'asparagus', 'leek', 'beet', 'radish', 'turnip'
    ];
    
    // Fruit names for categorization
    const fruits = [
      'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
      'blackberry', 'peach', 'pear', 'plum', 'cherry', 'watermelon', 'melon',
      'kiwi', 'mango', 'pineapple', 'avocado', 'lemon', 'lime'
    ];
    
    vegetables.forEach(veg => {
      categoryMap[veg] = categories.find(c => c.name === 'Vegetables')?.id;
    });
    
    fruits.forEach(fruit => {
      categoryMap[fruit] = categories.find(c => c.name === 'Fruits')?.id;
    });
    
    // Assign products to categories based on name
    for (const product of productsToAssign) {
      const productNameLower = product.name.toLowerCase();
      let categoryId = null;
      
      // Check if the product name contains any of our keywords
      for (const [keyword, catId] of Object.entries(categoryMap)) {
        if (productNameLower.includes(keyword)) {
          categoryId = catId;
          break;
        }
      }
      
      // If no match, assign to a random category
      if (!categoryId) {
        const randomIndex = Math.floor(Math.random() * categories.length);
        categoryId = categories[randomIndex].id;
      }
      
      assignments.push({
        product_id: product.id,
        category_id: categoryId
      });
    }
    
    // Insert the assignments in batches to avoid query size limits
    const batchSize = 50;
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      const { error: assignError } = await supabase
        .from('product_categories')
        .insert(batch);
      
      if (assignError) {
        console.error(`Error assigning products to categories (batch ${i / batchSize + 1}):`, assignError);
      }
    }
    
    console.log(`Successfully assigned ${assignments.length} products to categories.`);
    return true;
    
  } catch (error) {
    console.error('Unexpected error during category setup:', error);
    return false;
  }
} 