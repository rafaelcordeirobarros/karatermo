const termContainer = document.getElementById("term-container");
const termElement = document.getElementById("term");
const meaningElement = document.getElementById("meaning");
const questionTextElement = document.getElementById("questionText");
const choicesElement = document.getElementById("choices");
const feedbackElement = document.getElementById("feedback");
const statsContainer = document.getElementById("stats-container");
const statisticsElement = document.getElementById("statistics");
const divSendStatisticsElement = document.getElementById("divSendStatistics");
const feedbackMessage = document.getElementById("feedbackMessage");

let currentTerm;
let attempts = 0;
let maxAttempts = 2;
let startTime;

// Função para definir o termo do dia
var refenceDate = todayInBrazil().getFullYear() + "-" + (todayInBrazil().getMonth()+1).toString().padStart(2,"0") + "-" + todayInBrazil().getDate().toString().padStart(2,"0");
function setDailyTerm(terms) {
    // resetando o conteudo;
    statsContainer.style.display = "none";
    termElement.style.display = "none";
    meaningElement.style.display = "none";
    feedbackElement.style.display = "none";
    feedbackMessage.style.display = 'none';
    termContainer.style.display = 'none';

    attempts = 0;

    const dailyTerm = terms.find(term => term.usage.includes(refenceDate));
    
    // Verifica se o usuário já respondeu ao termo do dia
    const results = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    let termAnswered;
    
    if (dailyTerm) {
        termAnswered = results.some(result => result.term === dailyTerm.term);
        termContainer.style.display = 'block';
        currentTerm = dailyTerm;
        termElement.textContent = "";
        meaningElement.textContent = "";
        choicesElement.innerHTML = "";

        if (termAnswered) {
            feedbackMessage.innerHTML = `Você já descobriu o termo do dia! Aguardando o próximo dia.`;
            feedbackMessage.style.display = 'block';
            displayTermAndMeaning(dailyTerm.term, dailyTerm.meaning); // Exibe o termo e o significado com a formatação desejada
            displayStatistics();
            return;

        }else{
            questionTextElement.textContent = currentTerm.question.questionText;
            currentTerm.question.choices.forEach(choice => {
                const button = document.createElement("button");
                button.textContent = choice.charAt(0).toUpperCase() + choice.slice(1);
                button.onclick = () => checkAnswer(choice);
                choicesElement.appendChild(button);
            });
        }

        startTime = new Date(); // Inicia o tempo ao carregar o termo
    } else {
        feedbackMessage.innerHTML = "Hoje não há termo disponível. Volte amanhã!";
        feedbackMessage.style.display = 'block';
    }
}

// Função para verificar a resposta do usuário
function checkAnswer(selectedChoice) {
    attempts++;
    const isCorrect = selectedChoice === currentTerm.question.correctAnswer;
    feedbackElement.style.display = "block";
    if (isCorrect) {
        const endTime = new Date();
        const totalTime = Math.floor((endTime - startTime) / 1000); // Tempo total em segundos
        saveResult(true, totalTime);
        feedbackElement.textContent = "Parabéns! Você acertou! Aguarde para descobrir o termo do próximo dia.";
        
        displayTermAndMeaning(currentTerm.term, currentTerm.meaning); // Exibe termo e significado
    } else {
        feedbackElement.textContent = `Resposta errada! Tentativas restantes: ${maxAttempts - attempts}`;
        
        if (attempts >= maxAttempts) {
            const endTime = new Date();
            const totalTime = Math.floor((endTime - startTime) / 1000); // Tempo total em segundos
            saveResult(false, totalTime);
            
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

    sendResultsToRanking();
    displayStatistics();
}

function sendResultsToRanking(){
    const storedData = JSON.parse(localStorage.getItem("karatermoPlayer"));
    console.log(storedData);
    
    if (storedData) {

        const name = storedData.player.name;
        const belt = storedData.player.belt;
        const email = storedData.player.email;
        const password = storedData.player.password;
        const userData = { name, belt, email, password };

        const lastResult = { player: userData, results: [getResults()]}; // função getResults fica em sendResults.js
    
        sendResults(lastResult); // função fica em sendResultts.js
    }

    
}

// Função para inserir ou atualizar um resultado usando o endpoint upsertResults
async function upsertResults(resultData) {

    try {
      const response = await fetch(endpoint_upsertResults, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resultData)
      });
  
      if (!response.ok) {
        throw new Error('Erro ao inserir ou atualizar o resultado');
      }
  
      const data = await response.json();
      console.log('Resultado inserido ou atualizado:', data);
      console.log('ID do item:', data._id); // Acessa o ID do item inserido ou atualizado
    } catch (error) {
      console.error('Erro:', error);
    }
  }

// Função para exibir as estatísticas do usuário
function displayStatistics() {
    const results = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    const player = JSON.parse(localStorage.getItem("karatermoPlayer")) || [];
    
    const totalTerms = results.length;
    const totalCorrect = results.filter(result => result.correct).length;
    const totalAttempts = results.reduce((sum, result) => sum + result.attempts, 0);
    const totalTimeSpent = results.reduce((sum, result) => sum + result.totalTime, 0);
    const averageTime = totalTimeSpent > 0 ? totalTimeSpent / totalTerms : 0;
    const accuracy = totalCorrect > 0 ? (totalCorrect / totalTerms) * 100 : 0;

    // Calcula a pontuação com a regra ajustada para redução a cada 10 segundos
    const rawScore = (1000 * (accuracy / 100)) - (averageTime / 10);
    const score = Math.max(0, Math.round(rawScore)); // Ajusta para zero caso seja negativo

    if (player)
        divSendStatisticsElement.style.display = "none";
    else
        divSendStatisticsElement.style.display = "block";
        
    // Exibe a pontuação antes das demais estatísticas
    statisticsElement.innerHTML = `
        <p class="score">Pontuação: <span>${score}</span></p>
        <p>Número de termos respondidos: ${totalTerms}</p>
        <p>Número de acertos: ${totalCorrect}</p>
        <p>Número de erros: ${totalTerms - totalCorrect}</p>
        <p>Quantidade de tentativas: ${totalAttempts}</p>
        <p>Tempo médio gasto por termo (seg): ${(averageTime).toFixed(2)}</p>
    `;

    statsContainer.style.display = "block"; // Mostra o contêiner de estatísticas
}


  


// Função para formatar o tempo em hh:mm:ss
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.ceil(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Modal elements
const instructionModal = document.getElementById("instructionModal");
const dateModal = document.getElementById("dateModal");
const helpIcon = document.getElementById("help-icon");
const settingsIcon = document.getElementById("settings-icon");
const userInfoIcon = document.getElementById("userInfo-icon");
const closeButtons = document.querySelectorAll(".close-button");
const dateOptionsContainer = document.getElementById("date-options");
const rankingIcon = document.getElementById("ranking-icon");
const rankingModal = document.getElementById("ranking-modal");
const sendResultsModal = document.getElementById("send-stats-modal");

function toggleMenu() {
    const menu = document.getElementById('menu');
    const icon = document.querySelector('.menu-icon');
    menu.classList.toggle('open');
    icon.classList.toggle('open');
  }
  
  // Fecha o menu ao clicar em um item
  document.querySelectorAll('#menu a').forEach(item => {
    item.addEventListener('click', () => {
      closeMenu();
    });
  });
  
  // Fecha o menu ao clicar fora dele
  document.addEventListener('click', (event) => {
    const menu = document.getElementById('menu');
    const icon = document.querySelector('.menu-icon');
  
    if (!menu.contains(event.target) && !icon.contains(event.target)) {
      closeMenu();
    }
  });
  
  function closeMenu() {
    const menu = document.getElementById('menu');
    const icon = document.querySelector('.menu-icon');
    menu.classList.remove('open');
    icon.classList.remove('open');
  }
  

function openModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Evento para abrir o modal de instruções
helpIcon.onclick = () => {
    instructionModal.style.display = "block";
};

// Exibir o modal ao clicar no ícone de ranking
rankingIcon.onclick = async () => {
    rankingModal.style.display = "block";
    await loadRanking();
};

// Evento para abrir o modal de seleção de data
settingsIcon.onclick = async () => {
    dateModal.style.display = "block";
    await loadAvailableDates();
};

// Evento para abrir o modal de seleção de data
userInfoIcon.onclick = async () => {
    openModal('send-stats-modal');
};


// Evento para fechar modais ao clicar no botão de fechar
closeButtons.forEach(button => {
    button.onclick = () => {
        instructionModal.style.display = "none";
        dateModal.style.display = "none";
        rankingModal.style.display = "none";
        sendResultsModal.style.display = "none";
    };
});

// Fecha o modal ao clicar fora do conteúdo
window.onclick = (event) => {
    if (event.target === instructionModal) instructionModal.style.display = "none";
    if (event.target === dateModal) dateModal.style.display = "none";
    if (event.target === sendResultsModal) sendResultsModal.style.display = "none";
    if (event.target === rankingModal) rankingModal.style.display = "none";
};


// Função para carregar e exibir o ranking
let rankingData;
async function loadRanking() {

    await loadingRankingSelect();
    // await loadRankingCarousel();
    //await loadRankingTabs();
}


// Carrega as datas disponíveis no modal
async function loadAvailableDates() {
    dateOptionsContainer.innerHTML = "";
    const terms = await loadTerms();
    const answeredTerms = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    const correctAnsweredDates = terms.filter(item => answeredTerms.some(answered => answered.term == item.term && answered.correct)).flatMap(item => item.usage);
    const wrongAnsweredDates = terms.filter(item => answeredTerms.some(answered => answered.term == item.term && !answered.correct)).flatMap(item => item.usage);

    let today = todayInBrazil().setHours(0, 0, 0, 0);  // Data de hoje sem horas/minutos/segundos para comparar
    
    const availableDates = terms
        .flatMap(term => term.usage)
        .filter(date => new Date((new Date(date)).getTime() + (3 * 3600000)) <= today) // Ignora datas futuras
        .sort((a, b) => new Date(b) - new Date(a));

    availableDates.forEach(date => {
        const dateButton = document.createElement("button");
        dateButton.textContent = date;
        
        if (correctAnsweredDates.some(item => item == date))
            dateButton.classList.add("correct-answered-date");
        if (wrongAnsweredDates.some(item => item == date))
            dateButton.classList.add("wrong-answered-date");

        dateButton.onclick = () => loadTermForDate(date);
        dateOptionsContainer.appendChild(dateButton);
    });
}

// Carrega o termo para a data selecionada
async function loadTermForDate(date) {
    refenceDate = date;
    const terms = await loadTerms();
    const selectedTerm = terms.find(term => term.usage.includes(date));
    
    if (selectedTerm) {
        currentTerm = selectedTerm;
        
        setDailyTerm(terms);
    }

    dateModal.style.display = "none";
}

// Inicializa o jogo ao carregar a página
window.onload = async () => {
    const terms = await loadTerms();
    setDailyTerm(terms);
};

