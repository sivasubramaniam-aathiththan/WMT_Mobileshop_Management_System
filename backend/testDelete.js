import axios from 'axios';

async function testDelete() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3000/api/user/login', {
      email: 's.aathiththan14@gmail.com',
      password: 'admin123' // Assuming this is the password
    });

    console.log('Login successful');
    const token = loginResponse.data.token;

    // Get products
    const productsResponse = await axios.get('http://localhost:3000/api/product/allproducts');
    const products = productsResponse.data.products;
    console.log(`Found ${products.length} products`);

    if (products.length > 0) {
      const productId = products[0]._id;
      console.log(`Attempting to delete product: ${productId}`);

      // Try to delete
      const deleteResponse = await axios.delete(`http://localhost:3000/api/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Delete successful:', deleteResponse.data);
    }

  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testDelete();