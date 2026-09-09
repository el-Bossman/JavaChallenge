/* =========================================================
   ESTADO
========================================================= */

let challenges = [];

let currentChallenge = 0;

let completedChallenges =
    JSON.parse(
        localStorage.getItem("javaLabProgress")
    ) || [];


/* =========================================================
   DOM
========================================================= */

let challengeList;
let challengeNumber;
let challengeTitle;
let challengeDescription;
let hintButton;
let hintContent;
let codeEditor;
let editor;
let output;
let progressText;
let progressFill;
let navigationProgress;
let previousButton;
let nextButton;
let resetButton;
let runButton;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    /* ---------- Obtener elementos del DOM ---------- */

    challengeList =
        document.getElementById("challenge-list");

    challengeNumber =
        document.getElementById("challenge-number");

    challengeTitle =
        document.getElementById("challenge-title");

    challengeDescription =
        document.getElementById("challenge-description");

    hintButton =
        document.getElementById("hint-button");

    hintContent =
        document.getElementById("hint-content");

    codeEditor =
        document.getElementById("code-editor");

    output =
        document.getElementById("output");

    progressText =
        document.getElementById("progress-text");

    progressFill =
        document.getElementById("progress-fill");

    navigationProgress =
        document.getElementById("navigation-progress");

    previousButton =
        document.getElementById("previous-button");

    nextButton =
        document.getElementById("next-button");

    resetButton =
        document.getElementById("reset-button");

    runButton =
        document.getElementById("run-button");


    /* ---------- Cargar desafíos ---------- */

    try {

        await loadChallenges();

        renderChallengeList();

        loadChallenge(0);

        updateProgress();

        editor = CodeMirror.fromTextArea(
            codeEditor,
            {
                mode: "text/x-java",
                theme: "dracula",
                lineNumbers: true,
                indentUnit: 4,
                tabSize: 4,
                indentWithTabs: false
            }
        );

        connectEvents();

    } catch (error) {

        console.error(
            "Error al inicializar el portal:",
            error
        );

        showOutput(
            "No se pudieron cargar los desafíos."
        );
    }

    
}


/* =========================================================
   EVENTOS
========================================================= */

function connectEvents() {

    hintButton.addEventListener(
        "click",
        toggleHint
    );


    resetButton.addEventListener(
        "click",
        resetCode
    );


    runButton.addEventListener(
        "click",
        evaluateChallenge
    );


    previousButton.addEventListener(
        "click",
        () => {

            loadChallenge(
                currentChallenge - 1
            );

        }
    );


    nextButton.addEventListener(
        "click",
        () => {

            loadChallenge(
                currentChallenge + 1
            );

        }
    );


    codeEditor.addEventListener(
        "keydown",
        handleEditorKeyboard
    );
}


/* =========================================================
   LOAD JSON
========================================================= */

async function loadChallenges() {

    const response =
        await fetch("data/challenges.json");


    if (!response.ok) {

        throw new Error(
            "No se pudo cargar challenges.json"
        );

    }


    challenges =
        await response.json();
}


/* =========================================================
   SIDEBAR
========================================================= */

function renderChallengeList() {

    challengeList.innerHTML = "";


    challenges.forEach(
        (challenge, index) => {

            const button =
                document.createElement("button");


            button.type = "button";


            button.classList.add(
                "lesson"
            );


            button.dataset.challenge =
                index;


            button.textContent =
                `${index + 1}. ${challenge.titulo}`;


            button.addEventListener(
                "click",
                () => {

                    loadChallenge(index);

                }
            );


            challengeList.appendChild(
                button
            );

        }
    );


    updateChallengeList();
}


/* =========================================================
   LOAD CHALLENGE
========================================================= */

function loadChallenge(index) {

    if (
        index < 0 ||
        index >= challenges.length
    ) {

        return;

    }


    currentChallenge = index;


    const challenge =
        challenges[index];


    /* ---------- Información ---------- */

    challengeNumber.textContent =
        `Desafío ${index + 1}`;


    challengeTitle.textContent =
        challenge.titulo;


    challengeDescription.innerHTML = `
        <p>
            ${challenge.enunciado}
        </p>

    `;


    /* ---------- Código ---------- */

    editor.setValue( 
        challenge.codigo_base

    )
    /* ---------- Pista ---------- */

    hintContent.textContent =
        challenge.pista || "";


    hintContent.hidden = true;


    hintButton.textContent =
        "💡 Mostrar pista";


    /* ---------- Estado ---------- */

    clearOutput();


    updateNavigation();

    updateChallengeList();
}


/* =========================================================
   HINT
========================================================= */

function toggleHint() {

    const isHidden =
        hintContent.hidden;


    hintContent.hidden =
        !isHidden;


    hintButton.textContent =
        isHidden
            ? "💡 Ocultar pista"
            : "💡 Mostrar pista";
}


/* =========================================================
   RESET CODE
========================================================= */

function resetCode() {

    const challenge =
        challenges[currentChallenge];


    editor.SetValue(
        challenge.codigo_base
    ) 
        


    clearOutput();
}


/* =========================================================
   CLEAR OUTPUT
========================================================= */

function clearOutput() {

    output.innerHTML = `
        <div class="output-placeholder">

            <span>🖥️</span>

            <p>
                Evalúa tu código para comprobar
                si la solución es correcta.
            </p>

        </div>
    `;
}


/* =========================================================
   EVALUATE
========================================================= */

function evaluateChallenge() {

    const challenge =
        challenges[currentChallenge];


    const code =
        editor.getValue();


    /* ---------- Código vacío ---------- */

    if (!code.trim()) {

        showOutput(
            false,
            challenge.pista
        );

        return;
    }


    /* ---------- Validar ---------- */

    const result =
        validateChallenge(
            code,
            challenge
        );


    /* ---------- Correcto ---------- */

    if (result.success) {

        showOutput(
            true,
            challenge.leccion_corta
        );


        markChallengeCompleted(
            currentChallenge
        );


        return;
    }


    /* ---------- Incorrecto ---------- */

    showOutput(
        false,
        challenge.pista
    );
}


/* =========================================================
   VALIDATION
========================================================= */

function validateChallenge(
    code,
    challenge
) {

    if (!challenge.solucion_esperada) {

        return {

            success: false,

            message:
                "Este desafío todavía no tiene una solución esperada."

        };

    }


    const codigoAlumno =
        normalizarCodigo(code);


    const solucionEsperada =
        normalizarCodigo(
            challenge.solucion_esperada
        );


    if (
        codigoAlumno ===
        solucionEsperada
    ) {

        return {

            success: true,

            message:
                "Tu código coincide con la solución esperada."

        };

    }


    return {

        success: false,

        message:
            "El código todavía no coincide con la solución esperada."

    };
}


/* =========================================================
   NORMALIZAR CÓDIGO
========================================================= */

function normalizarCodigo(code) {

    return code
        .replace(/\s/g, "");
}


/* =========================================================
   OUTPUT UI
========================================================= */

function showOutput(
    success,
    message
) {

    output.innerHTML = `
        <div class="output-result ${success ? "success" : "error"}">

            <div class="output-icon">
                ${success ? "✓" : "✕"}
            </div>

            <p class="output-message">
                ${message}
            </p>

        </div>
    `;
}


/* =========================================================
   COMPLETE
========================================================= */

function markChallengeCompleted(index) {

    if (
        completedChallenges.includes(index)
    ) {

        return;

    }


    completedChallenges.push(
        index
    );


    localStorage.setItem(
        "javaLabProgress",
        JSON.stringify(
            completedChallenges
        )
    );


    updateProgress();

    updateChallengeList();
}


/* =========================================================
   SIDEBAR STATE
========================================================= */

function updateChallengeList() {

    const lessons =
        challengeList.querySelectorAll(
            ".lesson"
        );


    lessons.forEach(
        (lesson, index) => {

            lesson.classList.toggle(
                "active",
                index === currentChallenge
            );


            lesson.classList.toggle(
                "completed",
                completedChallenges.includes(
                    index
                )
            );

        }
    );
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    if (
        challenges.length === 0
    ) {

        return;

    }


    const completed =
        completedChallenges.length;


    const percentage =
        Math.round(
            (
                completed /
                challenges.length
            ) * 100
        );


    progressText.textContent =
        `${percentage}%`;


    progressFill.style.width =
        `${percentage}%`;
}


/* =========================================================
   NAVIGATION
========================================================= */

function updateNavigation() {

    navigationProgress.textContent =
        `${currentChallenge + 1} / ${challenges.length}`;


    previousButton.disabled =
        currentChallenge === 0;


    nextButton.disabled =
        currentChallenge ===
        challenges.length - 1;
}


/* =========================================================
   EDITOR
========================================================= */

function handleEditorKeyboard(event) {

    if (
        event.key !== "Tab"
    ) {

        return;

    }


    event.preventDefault();


    const start =
        codeEditor.selectionStart;


    const end =
        codeEditor.selectionEnd;


    const indentation =
        "    ";


    codeEditor.value =
        codeEditor.value.substring(
            0,
            start
        ) +

        indentation +

        codeEditor.value.substring(
            end
        );


    codeEditor.selectionStart =
        start + indentation.length;


    codeEditor.selectionEnd =
        start + indentation.length;
}