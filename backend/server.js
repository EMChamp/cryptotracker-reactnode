const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser'); // Add this line

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Add this line to parse JSON request bodies
const PORT = 5000;
const API_KEY = ''; // Replace with your CoinMarketCap API key
const INTERVAL = 10000; // Poll every 10 seconds

// List of cryptocurrencies to track
let symbols = ['BTC', 'ETC'];

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Function to fetch cryptocurrency prices
const fetchPrices = async () => {
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
            params: {
                symbol: symbols.join(','),
                convert: 'USD'
            },
            headers: {
                'X-CMC_PRO_API_KEY': API_KEY
            }
        });

        const prices = symbols.reduce((acc, symbol) => {
            acc[symbol] = response.data.data[symbol].quote.USD.price;
            return acc;
        }, {});

        return prices;
    } catch (error) {
        console.error('Error fetching data from CoinMarketCap:', error);
        return null;
    }
};

// Broadcast prices to all connected clients
const broadcastPrices = (prices) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(prices));
        }
    });
};

// Poll CoinMarketCap API and broadcast prices
setInterval(async () => {
    const prices = await fetchPrices();
    if (prices) {
        broadcastPrices(prices);
    }
}, INTERVAL);

// Handle HTTP and WebSocket connections
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Endpoint to add a new symbol to track
app.post('/add-symbol', (req, res) => {
    const { symbol } = req.body;
    if (!symbols.includes(symbol.toUpperCase())) {
        symbols.push(symbol.toUpperCase());
        res.status(200).send({ success: true, symbols });
    } else {
        res.status(400).send({ success: false, message: 'Symbol already being tracked' });
    }
});