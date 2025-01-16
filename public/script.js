const API_BASE_URL = 'http://localhost:3000'; // Base URL for API routes

// Add a stock
document.getElementById('addStockForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const symbol = document.getElementById('symbol').value;
  const price = document.getElementById('price').value;

  const response = await fetch(`${API_BASE_URL}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, symbol, price }),
  });

  if (response.ok) {
    alert('Stock added successfully!');
    fetchStocks(); // Refresh stock list
  } else {
    alert('Error adding stock');
  }
});

// Delete a stock
async function deleteStock(symbol) {
    const response = await fetch(`${API_BASE_URL}/delete/${symbol}`, {
      method: 'DELETE',
    });
  
    if (response.ok) {
      alert('Stock deleted successfully!');
      fetchStocks(); // Refresh the stock list after deletion
    } else {
      alert('Error deleting stock');
    }
  }

async function fetchStocks() {
    const response = await fetch(`${API_BASE_URL}/all`);
    const stocks = await response.json();
  
    const stocksList = document.getElementById('stocks');
    stocksList.innerHTML = ''; // Clear existing list
  
    stocks.forEach((stock) => {
      const li = document.createElement('li');
      li.textContent = `${stock.name} (${stock.symbol}): $${stock.price}`;
      
      // Create a delete button for each stock
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', async () => {
        await deleteStock(stock.symbol);  // Call the delete function with the stock's symbol
      });
      
      // Append the button to the list item
      li.appendChild(deleteButton);
      
      // Add the list item to the stocks list
      stocksList.appendChild(li);
    });
  }
  

// Initial fetch of stocks on page load
fetchStocks();
