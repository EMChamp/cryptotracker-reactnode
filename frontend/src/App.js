import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [prices, setPrices] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [trackingSymbols, setTrackingSymbols] = useState(['BTC', 'ETC']);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrices(data);
    };

    return () => ws.close();
  }, []);

  const addSymbol = () => {
    if (newSymbol && !trackingSymbols.includes(newSymbol.toUpperCase())) {
      axios.post('http://localhost:5000/add-symbol', { symbol: newSymbol })
        .then(response => {
          setTrackingSymbols(response.data.symbols);
          setNewSymbol('');
        })
        .catch(error => {
          console.error('Error adding symbol:', error.response.data.message);
        });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CryptoTracker</h1>
      </header>
      <main>
        <div className="symbol-input">
          <input
            type="text"
            placeholder="Enter crypto symbol (e.g., BTC)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
          />
          <button onClick={addSymbol}>Add Symbol</button>
        </div>
        <div className="symbol-tracker">
          {trackingSymbols.map((symbol) => (
            <div key={symbol} className="symbol-card">
              <h2>{symbol}</h2>
              <p>{prices[symbol] ? `$${prices[symbol].toFixed(2)}` : 'Loading...'}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="App-footer">
        <p>&copy; 2024 CryptoTracker. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
