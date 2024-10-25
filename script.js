const termContainer = document.getElementById("term-container");
const termElement = document.getElementById("term");
const meaningElement = document.getElementById("meaning");
const questionTextElement = document.getElementById("questionText");
const choicesElement = document.getElementById("choices");
const feedbackElement = document.getElementById("feedback");
const statsContainer = document.getElementById("stats-container");
const statisticsElement = document.getElementById("statistics");

let currentTerm;
let attempts = 0;
let maxAttempts = 3;
let startTime;

// Função para carregar os termos do arquivo JSON
async function loadTerms() {
    const response = await fetch("termos.json");
    return await response.json();
}

// Função para definir o termo do dia
function setDailyTerm(terms) {
    const today = new Date().toISOString().split("T")[0];
    const dailyTerm = terms.find(term => term.usage.includes(today));

    // Verifica se o usuário já respondeu ao termo do dia
    const results = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    const termAnswered = results.some(result => result.term === dailyTerm.term);

    if (termAnswered) {
        termContainer.innerHTML = `<h2>Você já descobriu o termo do dia! Aguardando o próximo dia.</h2>`;
        displayTermAndMeaning(dailyTerm.term, dailyTerm.meaning); // Exibe o termo e o significado com a formatação desejada
        displayStatistics();
        return;
    }

    if (dailyTerm) {
        currentTerm = dailyTerm;
        termElement.textContent = "";
        meaningElement.textContent = "";
        questionTextElement.textContent = currentTerm.question.questionText;
        choicesElement.innerHTML = "";

        currentTerm.question.choices.forEach(choice => {
            const button = document.createElement("button");
            button.textContent = choice.charAt(0).toUpperCase() + choice.slice(1);
            button.onclick = () => checkAnswer(choice);
            choicesElement.appendChild(button);
        });

        startTime = new Date(); // Inicia o tempo ao carregar o termo
    } else {
        termContainer.innerHTML = "<h2>Hoje não há termo disponível. Volte amanhã!</h2>";
    }
}

// Função para verificar a resposta do usuário
function checkAnswer(selectedChoice) {
    attempts++;
    const isCorrect = selectedChoice === currentTerm.question.correctAnswer;

    if (isCorrect) {
        const endTime = new Date();
        const totalTime = Math.floor((endTime - startTime) / 1000); // Tempo total em segundos
        saveResult(true, totalTime);
        feedbackElement.textContent = "Parabéns! Você acertou!";
        displayTermAndMeaning(currentTerm.term, currentTerm.meaning); // Exibe termo e significado
    } else {
        feedbackElement.textContent = `Resposta errada! Tentativas restantes: ${maxAttempts - attempts}`;
        
        if (attempts >= maxAttempts) {
            const endTime = new Date();
            const totalTime = Math.floor((endTime - startTime) / 1000); // Tempo total em segundos
            saveResult(false, totalTime);
            feedbackElement.textContent += ` O termo era "${currentTerm.term}" (${currentTerm.meaning}). Aguarde o próximo dia para responder um novo termo.`;
            displayTermAndMeaning(currentTerm.term, currentTerm.meaning); // Exibe termo e significado
        }
    }
}

// Função para exibir o termo e o significado
function displayTermAndMeaning(term, meaning) {
    termElement.textContent = term;
    meaningElement.textContent = meaning;
    
    // Exibe as seções de termo e significado apenas se tiver conteúdo
    termElement.style.display = term ? "block" : "none";
    meaningElement.style.display = meaning ? "block" : "none";

    choicesElement.innerHTML = ""; // Limpa as opções para que não sejam clicáveis novamente
}

// Função para salvar o resultado no local storage
function saveResult(correct, totalTime) {
    const results = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    results.push({
        term: currentTerm.term,
        attempts: attempts,
        correct: correct,
        totalTime: totalTime
    });
    localStorage.setItem("karatermoResults", JSON.stringify(results));
    displayStatistics();
}

// Função para exibir as estatísticas do usuário
function displayStatistics() {
    const results = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    const totalTerms = results.length;
    const totalCorrect = results.filter(result => result.correct).length;
    const totalAttempts = results.reduce((sum, result) => sum + result.attempts, 0);
    const totalTimeSpent = results.reduce((sum, result) => sum + result.totalTime, 0);
    const averageTime = totalTimeSpent > 0 ? totalTimeSpent / totalTerms : 0;
    const accuracy = totalCorrect > 0 ? (totalCorrect / totalTerms) * 100 : 0;

    // Calcula a pontuação com a regra ajustada para redução a cada 10 segundos
    const rawScore = (1000 * (accuracy / 100)) - (averageTime / 10);
    const score = Math.max(0, Math.round(rawScore)); // Ajusta para zero caso seja negativo

    // Exibe a pontuação antes das demais estatísticas
    statisticsElement.innerHTML = `
        <p class="score">Pontuação: <span>${score}</span></p>
        <p>Número de termos respondidos: ${totalTerms}</p>
        <p>Número de acertos: ${totalCorrect}</p>
        <p>Número de erros: ${totalTerms - totalCorrect}</p>
        <p>Quantidade de tentativas: ${totalAttempts}</p>
        <p>Tempo médio gasto por termo: ${formatTime(averageTime)}</p>
    `;

    statsContainer.style.display = "block"; // Mostra o contêiner de estatísticas
}


// Função para formatar o tempo em hh:mm:ss
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}


// Seleciona os elementos do modal e do ícone de ajuda
const helpIcon = document.getElementById("help-icon");
const modal = document.getElementById("instructionModal");
const closeButton = document.querySelector(".close-button");

// Abre o modal ao clicar no ícone de ajuda
helpIcon.onclick = function() {
    modal.style.display = "block";
}

// Fecha o modal ao clicar no botão de fechar
closeButton.onclick = function() {
    modal.style.display = "none";
}

// Fecha o modal ao clicar fora do conteúdo
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}


// Inicializa o jogo ao carregar a página
window.onload = async () => {
    const terms = await loadTerms();
    setDailyTerm(terms);
};
