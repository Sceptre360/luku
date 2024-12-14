// Initialize data arrays
let salesData = [];
let receiptProducts = [];

// Initialize inventory array in localStorage if it doesn't exist
if (!localStorage.getItem('inventory')) {
    localStorage.setItem('inventory', JSON.stringify([]));
}

// Authentication state
let currentUser = null;

// Sidebar navigation
document.querySelectorAll('.sidebar-btn').forEach(button => {
    button.addEventListener('click', function() {
        const sectionId = this.getAttribute('data-section');
        if (sectionId) {
            showSection(sectionId);
        }
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.cyber-card').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Authentication functions
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Load user's specific data
        const userKey = `userData_${email}`;
        const userData = JSON.parse(localStorage.getItem(userKey) || '{}');
        
        // Initialize user data if it doesn't exist
        if (!userData.salesData) userData.salesData = [];
        if (!userData.inventory) userData.inventory = [];
        
        // Set current session data
        salesData = userData.salesData;
        localStorage.setItem('inventory', JSON.stringify(userData.inventory));
        
        document.getElementById('loginModal').style.display = 'none';
        updateAuthUI();
        updateDashboard();
        updateSalesTable();
        updateInventoryTable();
        alert('Login successful!');
    } else {
        alert('Invalid credentials');
    }
}

function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === email)) {
        alert('User already exists');
        return;
    }
    
    const newUser = { 
        email, 
        password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    document.getElementById('signupModal').style.display = 'none';
    updateAuthUI();
    initializeUserData();
    alert('Account created successfully!');
}

function handleSignout() {
    if (currentUser) {
        // Save current user's data before signing out
        const userKey = `userData_${currentUser.email}`;
        const userData = {
            salesData: salesData,
            inventory: JSON.parse(localStorage.getItem('inventory') || '[]')
        };
        localStorage.setItem(userKey, JSON.stringify(userData));
    }
    
    // Clear current session
    currentUser = null;
    localStorage.removeItem('currentUser');
    salesData = [];
    localStorage.setItem('inventory', JSON.stringify([]));
    
    updateAuthUI();
    updateDashboard();
    updateSalesTable();
    updateInventoryTable();
    showSection('dashboard');
}

function updateAuthUI() {
    const loginBtn = document.querySelector('.sidebar-btn[data-section="login"]');
    const signupBtn = document.querySelector('.sidebar-btn[data-section="signup"]');
    const signoutBtn = document.getElementById('signoutBtn');
    
    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (signoutBtn) signoutBtn.style.display = 'flex';
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (signupBtn) signupBtn.style.display = 'flex';
        if (signoutBtn) signoutBtn.style.display = 'none';
    }
}

function initializeUserData() {
    if (currentUser) {
        const userKey = `userData_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userKey) || '{}');
        
        salesData = userData.salesData || [];
        localStorage.setItem('inventory', JSON.stringify(userData.inventory || []));
    } else {
        salesData = [];
        localStorage.setItem('inventory', JSON.stringify([]));
    }
    
    updateDashboard();
    updateSalesTable();
    updateInventoryTable();
}

// Modal handling
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

function addNewProductField() {
    const productsList = document.getElementById('productsList');
    const newProduct = document.createElement('div');
    newProduct.className = 'product-entry';
    newProduct.innerHTML = `
        <input type="text" class="productName" placeholder="Product Name" required>
        <input type="number" class="quantity" placeholder="Quantity" min="1" required>
        <input type="number" class="unitPrice" placeholder="Unit Price (KES)" min="0" step="0.01" required>
        <button type="button" class="remove-product" onclick="removeProduct(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    productsList.appendChild(newProduct);
}

function removeProduct(button) {
    button.parentElement.remove();
}

function addProductToReceipt(event) {
    event.preventDefault();
    
    const companyName = document.getElementById('companyName').value;
    const productEntries = document.querySelectorAll('.product-entry');
    receiptProducts = [];
    let totalAmount = 0;

    productEntries.forEach(entry => {
        const productName = entry.querySelector('.productName').value;
        const quantity = parseFloat(entry.querySelector('.quantity').value);
        const unitPrice = parseFloat(entry.querySelector('.unitPrice').value);
        const subtotal = quantity * unitPrice;
        
        receiptProducts.push({
            productName,
            quantity,
            unitPrice,
            subtotal
        });
        
        totalAmount += subtotal;
        updateSalesData(productName, quantity, subtotal);
    });

    generateReceiptWithProducts(companyName, receiptProducts, totalAmount);
    updateDashboard();
}

function generateReceiptWithProducts(companyName, products, totalAmount) {
    const receiptContent = document.getElementById('receiptContent');
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    let receiptHTML = `
        <div class="receipt">
            <div class="watermark">PAID</div>
            <h2>${companyName}</h2>
            <p>Date: ${date}</p>
            <p>Time: ${time}</p>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    products.forEach(product => {
        receiptHTML += `
            <tr>
                <td>${product.productName}</td>
                <td>${product.quantity}</td>
                <td>Ksh ${product.unitPrice.toFixed(2)}</td>
                <td>Ksh ${product.subtotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    receiptHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>Total Amount:</strong></td>
                        <td><strong>Ksh ${totalAmount.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            <div class="thank-you-message">Thank you for your business!</div>
        </div>
    `;
    
    receiptContent.innerHTML = receiptHTML;
    document.querySelector('.download-btn').style.display = 'block';
}

function updateSalesData(productName, quantity, total) {
    const existingProduct = salesData.find(item => item.productName === productName);
    if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.total += total;
    } else {
        salesData.push({ productName, quantity, total });
    }
    updateSalesTable();
    saveUserData(); // Save after updating sales data
}

function updateSalesTable() {
    const tableBody = document.getElementById('salesTableBody');
    tableBody.innerHTML = '';
    
    salesData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>Ksh ${item.total.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize chart variables globally
let salesChart = null;
let pieChart = null;

function updateDashboard() {
    const totalSales = salesData.reduce((sum, item) => sum + item.total, 0);
    const totalProducts = salesData.reduce((sum, item) => sum + item.quantity, 0);
    
    document.getElementById('totalSalesAmount').textContent = `Ksh ${totalSales.toFixed(2)}`;
    document.getElementById('totalProductsSold').textContent = totalProducts;
    
    // Call updateCharts after updating the dashboard data
    updateCharts();
}

function updateCharts() {
    // Get the canvas elements
    const salesChartCanvas = document.getElementById('salesChart');
    const pieChartCanvas = document.getElementById('productsPieChart');

    // Check if canvas elements exist
    if (!salesChartCanvas || !pieChartCanvas) {
        console.error('Chart canvases not found');
        return;
    }

    // Get the contexts
    const ctx = salesChartCanvas.getContext('2d');
    const pieCtx = pieChartCanvas.getContext('2d');

    // Destroy existing charts if they exist
    if (salesChart) salesChart.destroy();
    if (pieChart) pieChart.destroy();

    // Prepare data for charts
    const labels = salesData.map(item => item.productName);
    const quantities = salesData.map(item => item.quantity);
    const amounts = salesData.map(item => item.total);

    // Generate colors for the charts
    const colors = labels.map((_, i) => `hsl(${(i * 360) / labels.length}, 70%, 50%)`);

    // Create new bar chart
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Quantity Sold',
                    data: quantities,
                    backgroundColor: colors.map(color => `${color}80`), // 50% opacity
                    borderColor: colors,
                    borderWidth: 1
                },
                {
                    label: 'Revenue (KES)',
                    data: amounts,
                    backgroundColor: colors.map(color => `${color}40`), // 25% opacity
                    borderColor: colors,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#333333'
                    },
                    ticks: {
                        color: '#00ff00'
                    }
                },
                x: {
                    grid: {
                        color: '#333333'
                    },
                    ticks: {
                        color: '#00ff00'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#00ff00'
                    }
                }
            }
        }
    });

    // Create new pie chart
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: quantities,
                backgroundColor: colors,
                borderColor: '#000000',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#00ff00'
                    }
                }
            }
        }
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    updateInventoryTable();
    updateAuthUI();
    initializeUserData();
    
    // Show dashboard by default
    showSection('dashboard');
    updateDashboard(); // This will initialize the charts
});

function checkAuthState() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    } else {
        currentUser = null;
        updateAuthUI();
    }
}

// Save user data after operations
function saveUserData() {
    if (currentUser) {
        const userKey = `userData_${currentUser.email}`;
        const userData = {
            salesData: salesData,
            inventory: JSON.parse(localStorage.getItem('inventory') || '[]')
        };
        localStorage.setItem(userKey, JSON.stringify(userData));
    }
}

function addInventoryItem(event) {
    event.preventDefault();
    
    const productName = document.getElementById('inventoryProductName').value;
    const buyingPrice = parseFloat(document.getElementById('inventoryBuyingPrice').value);
    const sellingPrice = parseFloat(document.getElementById('inventorySellingPrice').value);
    const quantity = parseInt(document.getElementById('inventoryQuantity').value);

    const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    
    // Check if product already exists
    const existingProduct = inventory.find(item => 
        item.productName.toLowerCase() === productName.toLowerCase()
    );
    
    if (existingProduct) {
        if (confirm('Product already exists. Do you want to update the quantity?')) {
            existingProduct.quantity += quantity;
            existingProduct.initialQuantity += quantity;
        }
    } else {
        inventory.push({
            productName,
            buyingPrice,
            sellingPrice,
            quantity,
            initialQuantity: quantity,
            sold: 0
        });
    }
    
    localStorage.setItem('inventory', JSON.stringify(inventory));
    saveUserData(); // Save after updating inventory
    updateInventoryTable();
    event.target.reset();
}

function updateInventoryTable() {
    const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    const tableBody = document.getElementById('inventoryTableBody');
    
    if (!tableBody) {
        console.error('Inventory table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    inventory.forEach(item => {
        const row = document.createElement('tr');
        const status = getProductStatus(item.quantity);
        
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>Ksh ${item.buyingPrice.toFixed(2)}</td>
            <td>Ksh ${item.sellingPrice.toFixed(2)}</td>
            <td>${item.initialQuantity}</td>
            <td>${item.quantity}</td>
            <td><span class="status-cell ${status.class}">${status.text}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function getProductStatus(quantity) {
    if (quantity <= 0) {
        return { text: 'Sold Out', class: 'status-sold-out' };
    } else if (quantity <= 5) {
        return { text: 'Low Stock', class: 'status-low-stock' };
    }
    return { text: 'In Stock', class: 'status-in-stock' };
}

// Add this to your DOMContentLoaded event listener if it's not already there
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Add event listener for inventory form
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', addInventoryItem);
    }
    
    updateInventoryTable();
});

function calculateProfit() {
    const productName = document.getElementById('profitProductName').value;
    const buyingPrice = parseFloat(document.getElementById('buyingPrice').value);
    const sellingPrice = parseFloat(document.getElementById('sellingPrice').value);
    const incurredCost = parseFloat(document.getElementById('incurredCost').value) || 0;

    const totalCost = buyingPrice + incurredCost;
    const profit = sellingPrice - totalCost;
    const profitMargin = (profit / sellingPrice) * 100;

    const profitResult = document.getElementById('profitResult');
    let resultHTML = `
        <div class="profit-details">
            <h3>${productName}</h3>
            <table>
                <tr>
                    <td>Buying Price:</td>
                    <td>Ksh ${buyingPrice.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Selling Price:</td>
                    <td>Ksh ${sellingPrice.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Incurred Costs:</td>
                    <td>Ksh ${incurredCost.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total Cost:</td>
                    <td>Ksh ${totalCost.toFixed(2)}</td>
                </tr>
                <tr class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    <td><strong>${profit >= 0 ? 'Profit' : 'Loss'}:</strong></td>
                    <td><strong>Ksh ${Math.abs(profit).toFixed(2)}</strong></td>
                </tr>
                <tr>
                    <td>Profit Margin:</td>
                    <td>${profitMargin.toFixed(2)}%</td>
                </tr>
            </table>
        </div>
    `;

    profitResult.innerHTML = resultHTML;
}

function downloadSalesData() {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Format the sales data for Excel
    const excelData = salesData.map(item => ({
        'Product Name': item.productName,
        'Quantity Sold': item.quantity,
        'Total Sales (KES)': item.total,
        'Date': new Date(item.date || Date.now()).toLocaleDateString()
    }));
    
    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
        { wch: 20 }, // Product Name
        { wch: 15 }, // Quantity
        { wch: 15 }, // Total Sales
        { wch: 15 }  // Date
    ];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `sales_data_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function showDonateModal() {
    const modal = document.getElementById('donateModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function copyMpesaNumber() {
    navigator.clipboard.writeText('0748825274')
        .then(() => {
            alert('M-Pesa number copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy number:', err);
            // Fallback for older browsers
            const tempInput = document.createElement('input');
            tempInput.value = '0748825274';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('M-Pesa number copied to clipboard!');
        });
}
