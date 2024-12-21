document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (userInput.trim() === '') return;

    appendMessage('You', userInput, 'user');
    document.getElementById('userInput').value = '';
    document.getElementById('userInput').focus();

    // Show typing indicator
    document.getElementById('typingIndicator').classList.remove('hidden');

    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userInput })
    })
    .then(response => response.json())
    .then(data => {
        // Hide typing indicator
        document.getElementById('typingIndicator').classList.add('hidden');
        appendMessage('Bot', data.response, 'bot');
    })
    .catch(error => {
        console.error('Error:', error);
        // Hide typing indicator
        document.getElementById('typingIndicator').classList.add('hidden');
        appendMessage('Bot', 'Sorry, something went wrong.', 'bot');
    });
}

function appendMessage(sender, message, messageType) {
    const chatbox = document.getElementById('chatbox');
    const messageElem = document.createElement('div');
    messageElem.className = `message ${messageType}`;
    messageElem.innerHTML = `${message}<span class="timestamp">${new Date().toLocaleTimeString()}</span>`;
    chatbox.appendChild(messageElem);
    chatbox.scrollTop = chatbox.scrollHeight;
}
