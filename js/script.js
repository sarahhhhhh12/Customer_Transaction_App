document.addEventListener("DOMContentLoaded", async function() {
    let customers = [];
    let transactions = [];

    const customerTable = document.getElementById('customerTable').getElementsByTagName('tbody')[0];
    const filterName = document.getElementById('filterName');
    const filterAmount = document.getElementById('filterAmount');
    const ctx = document.getElementById('transactionChart').getContext('2d');
    const totalCtx = document.getElementById('totalTransactionChart').getContext('2d');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const resetButton = document.getElementById('resetButton');
    const body = document.body;

    let chart;
    let totalChart;

    async function fetchData() {
        try {
            const customersResponse = await fetch('http://localhost:3000/api/customers');
            customers = await customersResponse.json();

            const transactionsResponse = await fetch('http://localhost:3000/api/transactions');
            transactions = await transactionsResponse.json();

            renderTable(transactions);
            updateTotalChart();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function renderTable(filteredTransactions) {
        customerTable.innerHTML = '';
        filteredTransactions.forEach(transaction => {
            const customer = customers.find(c => c.id === transaction.customer_id);
            const row = customerTable.insertRow();
            const customerCell = row.insertCell(0);
            customerCell.textContent = customer.name;
            customerCell.classList.add('customer-name');
            customerCell.setAttribute('data-customer-name', customer.name);
            row.insertCell(1).textContent = transaction.date;
            row.insertCell(2).textContent = transaction.amount;
        });
    }

    function updateChart(customerId) {
        const filteredTransactions = transactions.filter(t => t.customer_id === customerId);
        const dailyTotals = filteredTransactions.reduce((acc, transaction) => {
            const date = transaction.date;
            if (!acc[date]) acc[date] = 0;
            acc[date] += transaction.amount;
            return acc;
        }, {});

        const labels = Object.keys(dailyTotals);
        const data = Object.values(dailyTotals);

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Transaction Amount',
                    data: data,
                    backgroundColor: '#2D2241',
                    borderColor: '#7A51C9',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function updateTotalChart() {
        const totalTransactions = customers.map(customer => {
            const totalAmount = transactions
                .filter(t => t.customer_id === customer.id)
                .reduce((sum, transaction) => sum + transaction.amount, 0);
            return { name: customer.name, total: totalAmount };
        });

        const labels = totalTransactions.map(t => t.name);
        const data = totalTransactions.map(t => t.total);

        if (totalChart) {
            totalChart.destroy();
        }

        totalChart = new Chart(totalCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Transaction Amount',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    function applyFilters() {
        const nameFilter = filterName.value.toLowerCase();
        const amountFilterText = filterAmount.value.trim(); // Get the input text from the amount filter
        const amountFilter = parseFloat(amountFilterText); // Parse it to a float if possible
        
        const filteredTransactions = transactions.filter(transaction => {
            const customer = customers.find(c => c.id === transaction.customer_id);
            const nameMatch = customer.name.toLowerCase().includes(nameFilter);
            const amountString = transaction.amount.toString(); // Convert transaction amount to string for search
            const amountMatch = amountString.includes(amountFilterText); // Check if amount string contains the filter text
            return nameMatch && amountMatch;
        });
    
        renderTable(filteredTransactions);
        if (nameFilter) {
            const customerId = customers.find(c => c.name.toLowerCase().includes(nameFilter))?.id;
            if (customerId) {
                updateChart(customerId);
            }
        } else {
            if (chart) {
                chart.destroy();
            }
        }
    }
    

    function handleCustomerNameClick(event) {
        if (event.target.classList.contains('customer-name')) {
            const customerName = event.target.getAttribute('data-customer-name');
            filterName.value = customerName;
            applyFilters();
        }
    }

    function resetData() {
        filterName.value = '';
        filterAmount.value = '';
        renderTable(transactions);
        updateTotalChart();
    }

    // Toggle dark/light mode
    darkModeToggle.addEventListener('click', function() {
        body.classList.toggle('light-mode');
    });

    // Reset button event listener
    resetButton.addEventListener('click', resetData);

    filterName.addEventListener('input', applyFilters);
    filterAmount.addEventListener('input', applyFilters);
    customerTable.addEventListener('click', handleCustomerNameClick);

    // Fetch data from server and initialize
    fetchData();
});
