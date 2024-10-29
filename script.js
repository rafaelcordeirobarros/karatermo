const termContainer = document.getElementById("term-container");
const termElement = document.getElementById("term");
const meaningElement = document.getElementById("meaning");
const questionTextElement = document.getElementById("questionText");
const choicesElement = document.getElementById("choices");
const feedbackElement = document.getElementById("feedback");
const statsContainer = document.getElementById("stats-container");
const statisticsElement = document.getElementById("statistics");
const feedbackMessage = document.getElementById("feedbackMessage");

let currentTerm;
let attempts = 0;
let maxAttempts = 2;
let startTime;

const endpoint_root = 'https://karatermo-api.onrender.com';
const endpoint_getTerms = endpoint_root + '/getTerms';
const endpoint_getResults = endpoint_root + '/getResults';
const endpoint_upsertResults = endpoint_root + '/upsertResults';


function localStorageExpires()
{
    var toRemove = [],                      // Itens para serem removidos
        currentDate = todayInBrazil().getTime(); // Data atual em milissegundos

    for (var i = 0, j = localStorage.length; i < j; i++) {
       var key = localStorage.key(i),
           value = localStorage.getItem(key);

       // Verifica se o formato do item para evitar conflitar com outras aplicações
       if (value && value[0] === "{" && value.slice(-1) === "}") {

            // Decodifica de volta para JSON
            var current = JSON.parse(value);

            // Checa a chave expires do item especifico se for mais antigo que a data atual ele salva no array
            if (current.expires  && current.expires <= currentDate ) {
                toRemove.push(key);
            }
       }
    }

    // Remove itens que já passaram do tempo
    // Se remover no primeiro loop isto poderia afetar a ordem,
    // pois quando se remove um item geralmente o objeto ou array são reordenados
    for (var i = toRemove.length - 1; i >= 0; i--) {
        localStorage.removeItem(toRemove[i]);
    }
}

localStorageExpires();//Auto executa a limpeza

/**
 * Função para adicionar itens no localStorage
 * @param {string} chave Chave que será usada para obter o valor posteriormente
 * @param {*} valor Quase qualquer tipo de valor pode ser adicionado, desde que não falhe no JSON.stringify
 * @param {number} Tempo de vida em minutos do item
 */
function setLocalStorage(chave, valor, minutos)
{
    var expirarem = todayInBrazil().getTime() + (60000 * minutos);

    localStorage.setItem(chave, JSON.stringify({
        "value": valor,
        "expires": expirarem
    }));
}

/**
 * Função para obter itens do localStorage que ainda não expiraram
 * @param {string} chave Chave para obter o valor associado
 * @return {*} Retorna qualquer valor, se o item tiver expirado irá retorna undefined
 */
function getLocalStorage(chave)
{
    localStorageExpires();//Limpa itens

    var value = localStorage.getItem(chave);

    if (value && value[0] === "{" && value.slice(-1) === "}") {

        // Decodifica de volta para JSON
        var current = JSON.parse(value);

        return current.value;
    }
}

// Função para carregar os termos do arquivo JSON com cache em cookies de 1 dia
let terms;
async function loadTerms() {
    // Exibe o overlay de loading
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";
    
    if (terms) {
        loadingOverlay.style.display = "none"; // Oculta o loading
        return terms;
    }

    // Verifica se os termos estão no cookie
    const cachedTerms = getLocalStorage("terms");
    if (cachedTerms) {
        terms = cachedTerms;
        loadingOverlay.style.display = "none"; // Oculta o loading
        return terms;
    }

    try {
        const response = await fetch(endpoint_getTerms);
        if (!response.ok) throw new Error("Erro na requisição: " + response.status);

        terms = await response.json();
        console.log("Termos recebidos:", terms);

        // Armazena os termos em um cookie por 1 dia
        setLocalStorage("terms", terms, 1 * 24 * 60);
    } catch (error) {
        console.error("Erro ao buscar termos:", error);
    }

    // Oculta o overlay de loading ao finalizar
    loadingOverlay.style.display = "none";
    return terms;
}


function todayInBrazil(){
    // Create a new Date object with the current date and time
    let date = new Date();
    // Get the current time in milliseconds since January 1, 1970, 00:00:00 UTC
    let utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    // Create a new Date object for GMT-3
    let todayDate = new Date(utcTime - (3 * 3600000));

    return todayDate;
}

var refenceDate = todayInBrazil().getFullYear() + "-" + (todayInBrazil().getMonth()+1).toString().padStart(2,"0") + "-" + todayInBrazil().getDate().toString().padStart(2,"0");

// Função para definir o termo do dia
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
    const termAnswered = results.some(result => result.term === dailyTerm.term);
    
    if (termAnswered) {
        feedbackMessage.innerHTML = `Você já descobriu o termo do dia! Aguardando o próximo dia.`;
        feedbackMessage.style.display = 'block';
        displayTermAndMeaning(dailyTerm.term, dailyTerm.meaning); // Exibe o termo e o significado com a formatação desejada
        displayStatistics();
        return;
    }

    if (dailyTerm) {
        termContainer.style.display = 'block';
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
    const secs = Math.ceil(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Modal elements
const instructionModal = document.getElementById("instructionModal");
const dateModal = document.getElementById("dateModal");
const helpIcon = document.getElementById("help-icon");
const settingsIcon = document.getElementById("settings-icon");
const closeButtons = document.querySelectorAll(".close-button");
const dateOptionsContainer = document.getElementById("date-options");
const rankingIcon = document.getElementById("ranking-icon");
const rankingModal = document.getElementById("ranking-modal");
const sendResultsModal = document.getElementById("send-stats-modal");

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
    // Mostra o indicador de loading
    document.getElementById('loading-ranking').style.display = 'flex';

    try {
        await fetch(endpoint_getResults)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na requisição: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('resultados recebidos:', data);
                rankingData = data;
            })
            .catch(error => {
                console.error('Erro ao buscar termos:', error);
            });

        // Filtrar os resultados para manter apenas o último resultado de cada jogador
        const latestResults = rankingData.map(player => {
            const latestResult = player.results.reduce((latest, current) => {
                return current.reportDateTime > latest.reportDateTime ? current : latest;
            });
            return { player: player.player, results: [latestResult] };
        });

        // Ordena os jogadores com base na pontuação e critérios de desempate
        latestResults.sort((a, b) => {
            if (b.results[0].score !== a.results[0].score) {
                return b.results[0].score - a.results[0].score; // Pontuação
            } else if (b.results[0].accuracy !== a.results[0].accuracy) {
                return b.results[0].accuracy - a.results[0].accuracy; // Precisão
            } else if (b.results[0].averageTime !== a.results[0].averageTime) {
                return a.results[0].averageTime - b.results[0].averageTime; // Tempo médio (menor é melhor)
            } else if (b.results[0].totalCorrect !== a.results[0].totalCorrect) {
                return b.results[0].totalCorrect - a.results[0].totalCorrect; // Total correto
            } else if (b.results[0].totalAttempts !== a.results[0].totalAttempts) {
                return a.results[0].totalAttempts - b.results[0].totalAttempts; // Total de tentativas (menor é melhor)
            } else {
                return a.results[0].totalTimeSpent - b.results[0].totalTimeSpent; // Tempo total gasto (menor é melhor)
            }
        });

        // Atualiza o conteúdo do modal
        const podium = document.querySelector('.podium');
        const rankingList = document.getElementById('ranking-items');

        // Limpa o conteúdo anterior
        podium.innerHTML = '';
        rankingList.innerHTML = '';

        if (!latestResults || latestResults.length === 0) {
            podium.innerHTML = 'Nenhum resultado foi enviado. Seja o primeiro e envie suas estatísticas.';
        }

        // Atualiza o pódio e a lista de ranking
        latestResults.forEach((player, index) => {
            // Pódio
            if (index < 3) {
                const podiumPlace = document.createElement('div');
                podiumPlace.className = `podium-place ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}`;
                podiumPlace.innerHTML = `
                    <div class="player-name">${player.player.name}</div>
                    <div class="score">${player.results[0].score} pontos</div>
                    <div class="place-number">${index + 1}</div>
                `;
                podium.appendChild(podiumPlace);
            }

            // Lista de ranking
            const listItem = document.createElement('li');
            const accuracyPercent = (player.results[0].accuracy).toFixed(0);
            const averageTime = player.results[0].averageTime;
            const positionIcon = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

            listItem.innerHTML = `
                <span class="position ${positionIcon}">${index < 3 ? `<i class="fas fa-medal"></i> ${index + 1}º` : index + 1}</span> 
                <strong>${player.player.name}</strong>: ${player.results[0].score} pontos 
                <span class="expand-icon"><i class="fas fa-chevron-down"></i></span>
                <div class="collapsible" style="display: none;">
                    <div class="collapsible-content">
                        <span>Precisão: ${accuracyPercent}%</span> | 
                        <span>Tempo Médio: ${formatTime(averageTime)}</span> | 
                        <span>Total Corretos: ${player.results[0].totalCorrect}</span> | 
                        <span>Total de Tentativas: ${player.results[0].totalAttempts}</span> | 
                        <span>Tempo Total: ${(player.results[0].totalTimeSpent / 60).toFixed(2)} min</span>
                    </div>
                </div>
            `;
            rankingList.appendChild(listItem);

            // Evento para colapsar os critérios de desempate
            listItem.querySelector('.expand-icon').onclick = () => {
                const collapsible = listItem.querySelector('.collapsible');
                const icon = listItem.querySelector('.expand-icon i');
                if (collapsible.style.display === 'block') {
                    collapsible.style.display = 'none';
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                } else {
                    collapsible.style.display = 'block';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            };
        });
    } catch (error) {
        console.error('Erro ao carregar o ranking:', error);
    } finally {
        // Esconde o indicador de loading
        document.getElementById('loading-ranking').style.display = 'none';
    }
}


// Carrega as datas disponíveis no modal
async function loadAvailableDates() {
    dateOptionsContainer.innerHTML = "";
    const terms = await loadTerms();
    const answeredTerms = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    const answeredDates = terms.filter(item => answeredTerms.some(answered => answered.term == item.term)).flatMap(item => item.usage);
    let today = todayInBrazil().setHours(0, 0, 0, 0);  // Data de hoje sem horas/minutos/segundos para comparar
    
    const availableDates = terms
        .flatMap(term => term.usage)
        .filter(date => new Date((new Date(date)).getTime() + (3 * 3600000)) <= today) // Ignora datas futuras
        .sort((a, b) => new Date(b) - new Date(a));

    availableDates.forEach(date => {
        const dateButton = document.createElement("button");
        dateButton.textContent = date;
        if (answeredDates.some(item => item == date)){ 
            dateButton.setAttribute("disabled", "disabled");
            dateButton.classList.add("answered-date");
        }
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

