const OPENAI_API_KEY = "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";
const BRIDGE_URL = "https://YOUR-INFINITY-DOMAIN.com/fetch_sales.php"; // Update this!

let dbRecords = [];
let mainChart = null;

window.onload = async () => {
    // Automatically detects ?client_id=51794 from the address bar
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');

    if (clientId) {
        document.getElementById('display-id').innerText = clientId;
        loadData(clientId);
    } else {
        document.getElementById('display-id').innerText = "NO ID";
        document.getElementById('aiResponse').innerText = "Please provide a Client ID in the URL.";
    }
};

async function loadData(id) {
    try {
        const res = await fetch(`${BRIDGE_URL}?client_id=${id}`);
        dbRecords = await res.json();
        
        if (dbRecords.length > 0) {
            refreshDashboard();
        } else {
            document.getElementById('aiResponse').innerText = "No records found for this Client ID.";
        }
    } catch (err) {
        console.error("Connection error:", err);
    }
}

function refreshDashboard() {
    // 1. Math logic using columns from your photo
    const totalRev = dbRecords.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
    const avgVal = totalRev / dbRecords.length;

    document.getElementById('total-revenue').innerText = `₹${totalRev.toLocaleString('en-IN')}`;
    document.getElementById('total-orders').innerText = dbRecords.length;
    document.getElementById('avg-ticket').innerText = `₹${Math.round(avgVal)}`;

    // 2. Chart logic
    const ctx = document.getElementById('salesChart').getContext('2d');
    const sorted = [...dbRecords].sort((a,b) => new Date(a.order_date) - new Date(b.order_date));
    
    if(mainChart) mainChart.destroy();
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sorted.map(r => r.order_date.split(' ')[0]),
            datasets: [{
                label: 'Revenue',
                data: sorted.map(r => r.total_amount),
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                fill: true, tension: 0.4
            }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

async function generateAIInsights() {
    const box = document.getElementById('aiResponse');
    box.innerText = "Analyzing your 190 recent orders...";

    const context = dbRecords.slice(0, 20).map(r => `₹${r.total_amount} on ${r.order_date}`).join(", ");

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: "You are a professional restaurant analyst. Summarize these sales trends and give 1 tip."
                }, {
                    role: "user",
                    content: `Analyze this data: ${context}`
                }]
            })
        });
        const json = await response.json();
        box.innerText = json.choices[0].message.content;
    } catch (e) {
        box.innerText = "AI temporarily offline. Check API credits.";
    }
}
