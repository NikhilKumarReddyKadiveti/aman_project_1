// CONFIGURATION
const OPENAI_API_KEY = "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";
const BRIDGE_URL = "https://YOUR-DOMAIN.infinityfreeapp.com/api_sales.php"; 

let salesData = [];
let salesChart = null;

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client_id');

    if (clientId) {
        document.getElementById('display-id').innerText = clientId;
        fetchData(clientId);
    } else {
        // Fallback for demo purposes if no ID is provided
        document.getElementById('display-id').innerText = "DEMO-MODE";
        console.warn("No client_id found in URL. Use ?client_id=51794");
    }
};

async function fetchData(id) {
    try {
        const response = await fetch(`${BRIDGE_URL}?client_id=${id}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        salesData = data;
        updateUI();
    } catch (err) {
        console.error("Fetch failed, ensure CORS is enabled in PHP:", err);
    }
}

function updateUI() {
    // 1. Calculate KPIs based on your 'total_amount' column
    const total = salesData.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
    const orderCount = salesData.length;
    const avg = orderCount > 0 ? total / orderCount : 0;

    document.getElementById('total-revenue').innerText = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('total-orders').innerText = orderCount;
    document.getElementById('avg-ticket').innerText = `₹${Math.round(avg)}`;

    // 2. Render Chart
    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Group totals by date
    const dailyTotals = {};
    salesData.forEach(item => {
        const date = item.order_date.split(' ')[0]; // Extract YYYY-MM-DD
        dailyTotals[date] = (dailyTotals[date] || 0) + parseFloat(item.total_amount);
    });

    const labels = Object.keys(dailyTotals).sort();
    const values = labels.map(l => dailyTotals[l]);

    if(salesChart) salesChart.destroy();

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (₹)',
                data: values,
                borderColor: '#0071e3',
                backgroundColor: 'rgba(0, 113, 227, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

async function generateAIInsights() {
    const btn = document.getElementById('aiBtn');
    const box = document.getElementById('aiResponse');
    
    if (salesData.length === 0) {
        box.innerText = "No data available to analyze.";
        return;
    }

    btn.innerText = "Analyzing Sales Patterns...";
    btn.disabled = true;

    // Create a data summary for OpenAI
    const summary = salesData.slice(0, 15).map(s => `Order ${s.custom_order_number}: ₹${s.total_amount}`).join(", ");

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a professional restaurant business analyst." },
                    { role: "user", content: `Here are the latest 15 orders for Client ${document.getElementById('display-id').innerText}. Provide a 3-sentence summary of performance and one growth tip: ${summary}` }
                ]
            })
        });

        const result = await res.json();
        box.innerHTML = result.choices[0].message.content.replace(/\n/g, "<br>");
    } catch (e) {
        box.innerText = "Error contacting AI. Check API key quota.";
    } finally {
        btn.innerText = "Ask AI Analyst";
        btn.disabled = false;
    }
}
