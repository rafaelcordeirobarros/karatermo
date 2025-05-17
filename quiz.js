let quizData = [
    {"_id":{"$oid":"671d954d8bbfc040a8eefc6c"},"term":"Sensei","meaning":"O professor ou instrutor que guia e ensina os estudantes de Karate.","question":{"questionText":"Qual é o título dado ao instrutor ou professor de Karate?","choices":["Sensei","Senpai","Dojo","Sempai"],"correctAnswer":"Sensei"}},
    {"_id":{"$oid":"671d954d8bbfc040a8eefc69"},"term":"Oi-zuki","meaning":"Soco executado enquanto o praticante avança em direção ao oponente.","question":{"questionText":"Qual é o nome do soco executado enquanto se avança em direção ao oponente?","choices":["Oi-zuki","Kizami-zuki","Jodan-uke","Gyaku-zuki"],"correctAnswer":"Oi-zuki"}}
];

const endpoint_root = 'https://karatermo-api.onrender.com';
const endpoint_getTerms = endpoint_root + '/getTerms';
const endpoint_getResults = endpoint_root + '/getResults';
const endpoint_upsertResults = endpoint_root + '/upsertResults';

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

let currentQuestionIndex = 0;
let score = 0;
let selectedDifficultyLevel = "";

const container = document.getElementById("quiz-container");


async function loadingDifficultySelect() {

    difficultyLevelContainer = document.getElementById("difficulty-level-container");
    difficultyLevelContainer.innerHTML = `<div class="select-container">
                                        <label for="difficultySelect">Exame para faixa:</label>
                                        <select id="difficultySelect">
                                            <!-- Opções serão geradas dinamicamente pelo JavaScript -->
                                        </select>
                                        <i class="fas fa-redo" onclick="restartQuiz()"></i>
                                        <hr class="divisor">
                                    </div>`;


    // Estrutura de dados para as abas e seu conteúdo
    const optionsData = [
        { id: "unselected", label: "Selecione"},
        { id: "blue", label: "Azul", colorClass: "icon-azul"},
        { id: "yellow", label: "Amarela", colorClass: "icon-amarela"},
        { id: "red", label: "Vermelha", colorClass: "icon-vermelha"},
        { id: "orange", label: "Laranja", colorClass: "icon-laranja"},
        { id: "green", label: "Verde", colorClass: "icon-verde"},
        { id: "purple", label: "Roxa", colorClass: "icon-roxa"},
        { id: "brown", label: "Marrom", colorClass: "icon-marrom"},
        { id: "black", label: "Preta", colorClass: "icon-preta" }
    ];
    
    // Inicializa o carrossel
    await populateSelect("difficultySelect", optionsData, resetQuiz);
    
}

function showQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        showResults();
        return;
    }
    
    const questionData = quizData[currentQuestionIndex];
    container.innerHTML = `
        <div class="question">
            <p>${questionData.question.questionText}</p>
            <div id="choices">
                ${questionData.question.choices.map(choice => `
                    <button class="choice-btn" onclick="selectAnswer('${choice}')">${choice}</button>
                `).join('')}
            </div>
        </div>
    `;
}

function selectAnswer(choice) {
    if (choice === quizData[currentQuestionIndex].question.correctAnswer) {
        score++;
    }
    currentQuestionIndex++;
    showQuestion();
}

function showResults() {
    container.innerHTML = `
        <div class="results">
            <h2>Quiz Finalizado!</h2>
            <p>Você acertou ${score} de ${quizData.length} perguntas.</p>
        </div>
    `;
}

function restartQuiz(){
    if (confirm("Você tem certeza que deseja reiniciar o quiz? Você perderá todo seu progresso.")){
        resetQuiz("");
    }
}

function resetQuiz(difficultyLevel){
        console.log(difficultyLevel);
        selectedDifficultyLevel = difficultyLevel && difficultyLevel!="unselected" ? difficultyLevel : "";
        score = 0;
        currentQuestionIndex = 0;
        container.innerHTML = "";        
        console.log("selected:" + selectedDifficultyLevel);

        if (selectedDifficultyLevel != ""){
            document.getElementById("difficultySelect").disabled = true;
            quizData = getQuizTerms(10,selectedDifficultyLevel);
            showQuestion();
        }else{
            document.getElementById("difficultySelect").selectedIndex = 0;
            document.getElementById("difficultySelect").disabled = false;
        }
}

function getQuizTerms(qtQuizTerms, beltColor) {
  const distribution = {
    easy: Math.floor(qtQuizTerms * 0.6),
    medium: Math.floor(qtQuizTerms * 0.3),
    hard: qtQuizTerms - Math.floor(qtQuizTerms * 0.6) - Math.floor(qtQuizTerms * 0.3),
  };

  // Função de embaralhamento (Fisher-Yates)
  function shuffleArray(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Filtra os termos pela dificuldade relativa à faixa e embaralha os choices
  function getTermsByDifficulty(level) {
    return shuffleArray(
      terms
        .filter(t => t.difficulty[beltColor] === level)
        .map(term => {
          // Cria uma cópia do objeto com choices embaralhadas
          return {
            ...term,
            question: {
              ...term.question,
              choices: shuffleArray(term.question.choices),
            },
          };
        })
    );
  }

  const difficulties = {
    easy: getTermsByDifficulty("easy"),
    medium: getTermsByDifficulty("medium"),
    hard: getTermsByDifficulty("hard"),
  };

  const selected = [];

  function fillFrom(difficulty, countNeeded) {
    let added = 0;

    // 1. Tenta pegar da dificuldade exata
    while (countNeeded > 0 && difficulties[difficulty].length > 0) {
      selected.push(difficulties[difficulty].pop());
      countNeeded--;
      added++;
    }

    // 2. Fallback para dificuldades mais altas
    const fallbackOrder = {
      easy: ["medium", "hard"],
      medium: ["hard"],
      hard: []
    };

    for (const fallback of fallbackOrder[difficulty]) {
      while (countNeeded > 0 && difficulties[fallback].length > 0) {
        selected.push(difficulties[fallback].pop());
        countNeeded--;
        added++;
      }
    }

    return added;
  }

  fillFrom("easy", distribution.easy);
  fillFrom("medium", distribution.medium);
  fillFrom("hard", distribution.hard);

  return shuffleArray(selected);
}



// Inicializa o jogo ao carregar a página
window.onload = async () => {
    terms = await loadTerms();
    loadingDifficultySelect();
};
