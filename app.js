let quotes = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchQuotes();
});

async function fetchQuotes() {
  const response = await fetch('/api/quotes');
  quotes = await response.json();
  displayQuotes(quotes);
}

function displayQuotes(quotes) {
  const quotesList = document.getElementById('quotesList');
  quotesList.innerHTML = '';
  quotes.forEach(quote => {
    const quoteElement = document.createElement('div');
    quoteElement.innerHTML = `
      <p>"${quote.text}" - ${quote.author}</p>
      <button onclick="selectQuote(${quote.id})">Memorize This</button>
    `;
    quotesList.appendChild(quoteElement);
  });
}

function selectQuote(quoteId) {
  window.location.href = `test.html?id=${quoteId}`;
}