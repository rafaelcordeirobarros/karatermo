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

  loadSettingsContainer();
}

async function loadSettingsContainer() {

    const settingsContainer = document.getElementById("settings-container");
    settingsContainer.innerHTML = `<label for="numberOfQuestions">Número de questões:</label>
                                    <input type="number" id="numberOfQuestions" min="1" max="50" maxlenght="2" value="20" required>
                                    <button id="startQuiz" type="button" onClick="resetQuiz('black')" >Iniciar Quiz</button>`;

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

    let stringAnsweredQuestions = formatHTMLAnsweredQuestionsWithCorrectAnswers();
    
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

function formatHTMLAnsweredQuestionsWithCorrectAnswers(){
  let stringAnsweredQuestions = "";
  if(answeredQuestions && answeredQuestions.length>0){
      stringAnsweredQuestions += `<div id="answered-questions-container" >
                                  <hr class="divisor">
                                  <h3>Perguntas respondidas:</h3>`;
      
      answeredQuestions.forEach((answeredQuestion, index) => {
        stringAnsweredQuestions += `
                                  <div class="answered-question ${answeredQuestion.answer==answeredQuestion.term.question.correctAnswer?"correct-":"wrong-"}answered-question">
                                      <p class="answered-questiontext">${index+1}. ${answeredQuestion.term.question.questionText}</p>
                                      <p><b>Você respondeu:</b> ${answeredQuestion.answer}</p>
                                      <p><b>Resposta certa:</b> ${answeredQuestion.term.question.correctAnswer}</p>
                                      <p><b>Explicação:</b> ${answeredQuestion.term.meaning}</p>
                                      
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

    alert("abra o arquivo baixado e compartilhe no whatsapp.");

  });
}

function restartQuiz(){
    if (confirm("Você tem certeza que deseja reiniciar o quiz? Você perderá todo seu progresso.")){
        resetQuiz("");
    }
}

function resetQuiz(difficultyLevel){
        selectedDifficultyLevel = difficultyLevel && difficultyLevel!="unselected" ? difficultyLevel : "";
        score = 0;
        answeredQuestions = [];
        currentQuestionIndex = 0;
        container.innerHTML = "";

        if (selectedDifficultyLevel != "" && document.getElementById("numberOfQuestions").value!="" && document.getElementById("numberOfQuestions").value>=10){
          document.getElementById("span-start-date").innerHTML = todayInBrazil().toLocaleString();
          document.getElementById("span-end-date").innerHTML = "";
          document.getElementById("quiz-user-information-container").style.display = "flex";
          document.getElementById("quiz-settings-container").style.display = "none";
          quizData = getQuizTerms(document.getElementById("numberOfQuestions").value*1,selectedDifficultyLevel);
          showQuestion();
        }else{
            if (selectedDifficultyLevel != "" && (document.getElementById("numberOfQuestions").value == "" || (document.getElementById("numberOfQuestions").value)<10) ){
              alert("Determine um número de questões acima de 10 questões!");
            }

            document.getElementById("quiz-user-information-container").style.display = "none";
            document.getElementById("quiz-settings-container").style.display = "block";
        }
}

function getQuizTerms(qtQuizTerms, beltColor) {
  const distribution = {
    "very easy": Math.floor(qtQuizTerms * 0.3),
    easy: Math.floor(qtQuizTerms * 0.3),
    medium: Math.floor(qtQuizTerms * 0.3),
    hard: qtQuizTerms - Math.floor(qtQuizTerms * 0.9)
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
    "very easy": getTermsByDifficulty("very easy"),
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
      "very easy": ["easy", "medium", "hard", "very hard"],
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

  fillFrom("very easy", distribution["very easy"]);
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
