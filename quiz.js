let quizData = [
    {"_id":{"$oid":"671d954d8bbfc040a8eefc6c"},"term":"Sensei","meaning":"O professor ou instrutor que guia e ensina os estudantes de Karate.","question":{"questionText":"Qual é o título dado ao instrutor ou professor de Karate?","choices":["Sensei","Senpai","Dojo","Sempai"],"correctAnswer":"Sensei"}},
    {"_id":{"$oid":"671d954d8bbfc040a8eefc69"},"term":"Oi-zuki","meaning":"Soco executado enquanto o praticante avança em direção ao oponente.","question":{"questionText":"Qual é o nome do soco executado enquanto se avança em direção ao oponente?","choices":["Oi-zuki","Kizami-zuki","Jodan-uke","Gyaku-zuki"],"correctAnswer":"Oi-zuki"}}
];

let currentQuestionIndex = 0;
let score = 0;
let selectedDifficultyLevel = "";
let answeredQuestions = [];
const container = document.getElementById("quiz-container");


async function loadQuizScreen() {

  loadIdentityContainer();
  loadingDifficultySelect();
}

async function loadIdentityContainer() {

    const identityContainer = document.getElementById("identity-container");
    identityContainer.innerHTML = `<label for="userName">Nome Completo:</label>
                                    <input type="text" id="userName" maxlength="30" required>`;

}

async function loadingDifficultySelect() {

    const difficultyLevelContainer = document.getElementById("difficulty-level-container");
    difficultyLevelContainer.innerHTML = `<div class="select-container">
                                        <label for="difficultySelect">Exame para faixa:</label>
                                        <select id="difficultySelect">
                                            <!-- Opções serão geradas dinamicamente pelo JavaScript -->
                                        </select>
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


function setupProgressBar(progress, maxProgress, step) {
  if (progress < maxProgress) {
    progress *= step;
    const barra = document.getElementById("progress-bar");
    barra.style.width = `${progress}%`;
  }
}

function showQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        showResults();
        return;
    }
    
    const questionData = quizData[currentQuestionIndex];
    container.innerHTML = `
        <div id="progress-container" style="width: 100%; background: #eee; border-radius: 8px; overflow: hidden;">
          <div id="progress-bar" style="width: 0%; height: 20px; background: #4caf50; transition: width 0.3s;"></div>
        </div>
        <div class="question">
            <p>${questionData.question.questionText}</p>
            <div id="choices">
                ${questionData.question.choices.map(choice => `
                    <button class="choice-btn" onclick="selectAnswer('${choice}')">${choice}</button>
                `).join('')}
            </div>
        </div>
    `;

    setupProgressBar(currentQuestionIndex,quizData.length, (1/quizData.length)*100);
}



function selectAnswer(choice) {
    answeredQuestions.push({ term: quizData[currentQuestionIndex], answer:choice});
    if (choice === quizData[currentQuestionIndex].question.correctAnswer) {
        score++;
    }
    currentQuestionIndex++;
    showQuestion();
}

function showResults() {
    document.getElementById("span-end-date").innerHTML = todayInBrazil().toLocaleString();

    let stringAnsweredQuestions = formatHTMLAnsweredQuestions();
    
    container.innerHTML = `
        <div class="results">
            <div id="results-options">
                <div>
                  <i id="icon-whatsapp" class="fab fa-whatsapp" onclick="shareWhatsapp()"></i>
                  <a id="linkDownload" style="display: none;" download="screenshot.png">Baixar imagem</a>
                </div>
                <div><i id="icon-restart-quiz" class="fas fa-rotate-right" onclick="restartQuiz()"></i></div>
            </div>
            <h2>Quiz Finalizado!</h2>
            <p>Sua nota foi ${((score/quizData.length)*10).toFixed(1)}</p>
            <p>Você acertou ${score} de ${quizData.length} perguntas.</p>
            ${stringAnsweredQuestions}
        </div>
    `;
}

function formatHTMLAnsweredQuestions(){
  let stringAnsweredQuestions = "";
  if(answeredQuestions && answeredQuestions.length>0){
      stringAnsweredQuestions += `<div id="answered-questions-container" >
                                  <hr class="divisor">
                                  <h3>Perguntas respondidas:</h3>`;
      
      answeredQuestions.forEach((answeredQuestion, index) => {
        stringAnsweredQuestions += `
                                  <div class="answered-question">
                                      <p class="answered-questiontext">${index+1}. ${answeredQuestion.term.question.questionText}</p>
                                      <p>${answeredQuestion.answer}</p>
                                  </div>
                              `;
      });
      
      stringAnsweredQuestions += `</div>`;
    }
    return stringAnsweredQuestions;
}

function shareWhatsapp(){
  html2canvas(document.body).then(canvas => {
    const imgData = canvas.toDataURL("image/png");

    // Cria um link de download da imagem (o WhatsApp não permite envio direto)
    const link = document.getElementById("linkDownload");
    link.href = imgData;
    link.click(); // Dispara download automático

    // Redireciona para WhatsApp com mensagem
    const texto = encodeURIComponent("Esse foi meu resultado no exame!");
    const url = `https://wa.me/?text=${texto}`;
    window.open(url, "_blank");

  });
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
        answeredQuestions = [];
        currentQuestionIndex = 0;
        container.innerHTML = "";        
        console.log("selected:" + selectedDifficultyLevel);

        if (selectedDifficultyLevel != "" && document.getElementById("userName").value!=""){
          document.getElementById("span-start-date").innerHTML = todayInBrazil().toLocaleString();
          document.getElementById("span-end-date").innerHTML = "";
          document.getElementById("span-user-name").innerHTML = document.getElementById("userName").value;
          document.getElementById("span-difficulty-selected").innerHTML = document.getElementById("difficultySelect").options[document.getElementById("difficultySelect").selectedIndex].text;
          document.getElementById("quiz-user-information-container").style.display = "flex";
          document.getElementById("quiz-settings-container").style.display = "none";
          quizData = getQuizTerms(20,selectedDifficultyLevel);
          showQuestion();
        }else{
            if (selectedDifficultyLevel != "" && document.getElementById("userName").value == ""){
              alert("Preencha seu nome");
            }

            document.getElementById("quiz-user-information-container").style.display = "none";
            document.getElementById("quiz-settings-container").style.display = "block";
            document.getElementById("difficultySelect").selectedIndex = 0;
        }
}

function getQuizTerms(qtQuizTerms, beltColor) {
  const distribution = {
    easy: Math.floor(qtQuizTerms * 0.5),
    medium: Math.floor(qtQuizTerms * 0.3),
    hard: qtQuizTerms - Math.floor(qtQuizTerms * 0.5) - Math.floor(qtQuizTerms * 0.3),
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
      easy: ["medium", "hard", "very hard", "very easy"],
      medium: ["hard","very hard","easy","very easy"],
      hard: ["very hard","medium","easy","very easy"]
    };

    for (const fallback of fallbackOrder[difficulty]) {
      console.log(difficulties[fallback]);
      if (difficulties[fallback]){
        while (countNeeded > 0 && difficulties[fallback].length > 0) {
          selected.push(difficulties[fallback].pop());
          countNeeded--;
          added++;
        }
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
    loadQuizScreen();
};
