// O jogo escolhe um número aleatório entre 1 e 100
let randomNumber = Math.floor(Math.random() * 100) + 1;

// Pega os elementos do HTML para poder interagir com eles
const guessInput = document.getElementById('guess-input');
const guessButton = document.getElementById('guess-button');
const message = document.getElementById('message');

let attempts = 0;

// Função que será chamada quando o botão for clicado
function checkGuess() {
    const userGuess = parseInt(guessInput.value);
    attempts++;

    // Verifica se o palpite é um número válido
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
        message.textContent = 'Por favor, digite um número entre 1 e 100.';
        message.style.color = 'red';
        return;
    }

    // Compara o palpite com o número secreto
    if (userGuess === randomNumber) {
        message.textContent = `Parabéns! Você acertou o número ${randomNumber} em ${attempts} tentativas.`;
        message.style.color = 'green';
        // Desabilita o campo e o botão após o acerto
        guessInput.disabled = true;
        guessButton.disabled = true;
    } else if (userGuess < randomNumber) {
        message.textContent = 'Muito baixo! Tente um número maior.';
        message.style.color = 'orange';
    } else {
        message.textContent = 'Muito alto! Tente um número menor.';
        message.style.color = 'orange';
    }

    // Limpa o campo de entrada para o próximo palpite
    guessInput.value = '';
    guessInput.focus();
}

// Adiciona um "escutador de eventos" para o clique no botão
guessButton.addEventListener('click', checkGuess);
