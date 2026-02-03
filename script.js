/**
 * RESTO-AI PRO: FINAL SYNC ENGINE
 * Designed for InfinityFree Security Bypass
 */

const BRIDGE_URL = "https://managment.lovestoblog.com/api_sales.php"; 

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id') || "51794";
    document.getElementById('display-id').innerText = clientId;
    
    // Attempt to fetch data immediately
    fetchData(clientId);
};

async function fetchData(id) {
    const aiBox = document.getElementById('aiResponse');
    
    try {
        const response = await fetch(`${BRIDGE_URL}?client_id=${id}`);
        
        // If the response is not JSON, InfinityFree blocked it
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Security Blocked");
        }

        const data = await response.json();
        
        // Mapping the data from your specific JSON format:
        // {"revenue":39050, "count":190, "orders": [...]}
        if (data && data.orders) {
            updateUI(data);
        }
    } catch (err) {
        console.log("Waiting for authorization...");
        showAuthorizeUI(id);
    }
}

function updateUI(data) {
    // 1. Set the Big Numbers
    document.getElementById('total-revenue').innerText = `₹${data.revenue.toLocaleString('en-IN')}`;
    document.getElementById('total-orders').innerText = data.count;
    
    const avg = data.count > 0 ? (data.revenue / data.count) : 0;
    document.getElementById('avg-ticket').innerText = `₹${Math.round(avg)}`;

    // 2. Set AI Insights (using the text already in your JSON)
    document.getElementById('aiResponse').innerHTML = data.ai_insights || "AI Analysis ready.";

    // 3. Draw the Trend Line
    renderTrendChart(data.orders);
}

function showAuthorizeUI(id) {
    const aiBox = document.getElementById('aiResponse');
    aiBox.innerHTML = `
        <div style="text-align:center; padding:10px; border:1px solid #ff4d4d; border-radius:12px;">
            <p style="color:#ff4d4d; font-size:0.9rem;">🔒 Connection Encrypted by Host</p>
            <a href="${BRIDGE_URL}?client_id=${id}" target="_blank" 
               style="color:#007AFF; font-weight:bold; text-decoration:none;"
               onclick="alert('After the data tab opens, come back here and refresh!')">
               [ CLICK HERE TO AUTHORIZE ]
            </a>
        </div>`;
}

function renderTrendChart(orders) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const sorted = [...orders].sort((a,b) => new Date(a.order_date) - new Date(b.order_date));
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sorted.map(r => r.order_date.split(' ')[0]),
            datasets: [{
                label: 'Sales Trend',
                data: sorted.map(r => r.total_amount),
                borderColor: '#007AFF',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 122, 255, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
